import { clamp, dbToPosition, parseConfig, type ChannelGroup, type MixerConfig, type Parameter } from './model';
import { dragLevel } from './faderPrecision';
import { captureBalance, groupKey, groupLevels, type GroupBalance } from './groups';

export interface Socket {
  readyState: number;
  onopen: (() => void) | null; onclose: (() => void) | null;
  onerror: (() => void) | null; onmessage: ((event: { data: any }) => void) | null;
  send(value: string): void; close(): void;
}
export type AuxPeer = { id: string; nickname: string | null };
export type MixState = {
  peers: AuxPeer[];
  status: 'disconnected' | 'connecting' | 'loading' | 'connected';
  config: MixerConfig | null; aux: number | null; parameter: Parameter;
  values: Record<number, number>; epoch: number;
  /** Channels whose send to this AUX is off on the desk (muted in this mix). */
  muted: Record<number, boolean>;
};
export type MixerControls = Omit<MixState, 'values' | 'muted'>;
export const REQUEST_KINDS = [
  { kind: 'more-me', label: 'More me' }, { kind: 'less-me', label: 'Less me' }, { kind: 'more-click', label: 'More click' },
  { kind: 'talk', label: 'Talk to me' }, { kind: 'problem', label: 'Problem' },
] as const;
export type RequestKind = typeof REQUEST_KINDS[number]['kind'];
/** A request this device sent to the engineer, and whether it was seen. */
export type SentRequest = { id: number; kind: RequestKind | null; text: string; at: number; acknowledged: boolean };
export type DragToken = { epoch: number; aux: number; channel: number; parameter: Parameter; members?: number[]; balance?: GroupBalance };
export type ValueCache = Record<string, Record<number, number>>;
export class MixerClient {
  private groups: Record<string, ChannelGroup[]> = {};
  private globalGroups: ChannelGroup[] = [];
  private balances: Record<string, GroupBalance> = {};
  configureGroups(groups: Record<string, ChannelGroup[]>, globalGroups: ChannelGroup[] = []) {
    this.cancelWrites(); this.groups = groups; this.globalGroups = globalGroups;
    const validKeys = new Set(Object.entries(groups).flatMap(([aux, entries]) => entries.map(group => groupKey(Number(aux), group.members))));
    const globalMembers = new Set(globalGroups.map(group => groupKey(1, group.members).split(':')[1]));
    this.balances = Object.fromEntries(Object.entries(this.balances).filter(([key]) => validKeys.has(key) || globalMembers.has(key.split(':')[1])));
    this.emit({});
  }
  getGroupBalances() { return this.balances; }
  restoreGroupBalances(raw: unknown) {
    this.balances = {};
    if (!raw || typeof raw !== 'object') return;
    for (const [key, entry] of Object.entries(raw).slice(0, 1000)) {
      if (!/^[1-9]\d*:[1-9]\d*(,[1-9]\d*)+$/.test(key) || !entry || typeof entry !== 'object') continue;
      const value = entry as GroupBalance, members = key.split(':')[1].split(',').map(Number);
      if (!value.offsets || !value.expected || !members.every(id =>
        (value.offsets[id] === null || (Number.isFinite(value.offsets[id]) && value.offsets[id]! <= 0 && value.offsets[id]! >= -160)) &&
        Number.isFinite(value.expected[id]) && value.expected[id] >= -150 && value.expected[id] <= 10)) continue;
      this.balances[key] = { offsets: Object.fromEntries(members.map(id => [id, value.offsets[id]])), expected: Object.fromEntries(members.map(id => [id, value.expected[id]])) };
    }
  }
  private members(channel: number) { return channel < 0 ? [...this.globalGroups, ...(this.groups[String(this.state.aux)] || [])].find(group => -group.id === channel)?.members : undefined; }
  canDrag(channel: number): boolean {
    const members = this.members(channel);
    return this.state.status === 'connected' && !!this.state.aux && this.socket?.readyState === 1 &&
      (channel < 0 ? this.state.parameter === 'level' && !!members && members.every(id => this.canDrag(id)) :
        this.state.values[channel] !== undefined && !!this.state.config?.channels.some(c => c.channel === channel));
  }
  private valueCache: ValueCache = {};
  cacheRevision = 0;
  liveLevels: Record<number, number> = {};
  levelGeneration = 0;
  private levelEdits = new Set<(aux: number, levels: Record<number, number>) => void>();
  onLevelEdit(fn: (aux: number, levels: Record<number, number>) => void) { this.levelEdits.add(fn); return () => { this.levelEdits.delete(fn); }; }
  private editedLevels(levels: Record<number, number>) {
    if (this.state.aux) this.levelEdits.forEach(fn => fn(this.state.aux!, levels));
  }
  restoreLevels(aux: number, levels: Record<number, number>) {
    if (aux !== this.state.aux || this.state.status !== 'connected' || this.socket?.readyState !== 1 || !this.state.config) return false;
    const entries = this.state.config.channels.filter(c => Number.isFinite(levels[c.channel]) && levels[c.channel] >= -150 && levels[c.channel] <= 10);
    this.cancelWrites();
    const applied: Record<number, number> = {};
    for (const c of entries) {
      const value = levels[c.channel];
      if (!this.send({ address: this.address(c.channel, aux, 'level'), args: [value] })) break;
      applied[c.channel] = value; this.remember(c.channel, value, 'level');
    }
    this.liveLevels = { ...this.liveLevels, ...applied };
    this.editedLevels(applied);
    this.emit(this.state.parameter === 'level' ? { values: { ...this.state.values, ...applied } } : {});
    return Object.keys(applied).length === entries.length;
  }
  getValueCache() { return this.valueCache; }
  /** Muted in this mix. A group is muted when every member is; unknown is not muted. */
  isMuted(channel: number): boolean {
    if (channel < 0) { const members = this.members(channel); return !!members?.length && members.every(id => this.state.muted[id] === true); }
    return this.state.muted[channel] === true;
  }
  canMute(channel: number): boolean {
    if (this.state.status !== 'connected' || !this.state.aux || this.socket?.readyState !== 1) return false;
    const ids = channel < 0 ? this.members(channel) || [] : [channel];
    return ids.length > 0 && ids.every(id => this.state.muted[id] !== undefined);
  }
  /** Turn the desk's send to this AUX off (muted) or on, keeping its level. A group mutes or unmutes every member. */
  setMuted(channel: number, muted: boolean) {
    if (!this.canMute(channel)) return false;
    const aux = this.state.aux!, next = { ...this.state.muted };
    for (const id of channel < 0 ? this.members(channel)! : [channel]) {
      if (!this.send({ address: this.address(id, aux, 'on'), args: [muted ? 0 : 1] })) return false;
      next[id] = muted;
    }
    this.emit({ muted: next });
    return true;
  }
  // Requests to the engineer, newest first. Low-rate, kept outside MixState.
  private requests: SentRequest[] = [];
  private requestListeners = new Set<() => void>();
  private requestFailed = false;
  subscribeRequests = (fn: () => void) => { this.requestListeners.add(fn); return () => { this.requestListeners.delete(fn); }; };
  requestsSnapshot = () => this.requests;
  requestRejected() { return this.requestFailed; }
  sendRequest(kind: RequestKind | null, text: string) {
    const trimmed = text.trim().slice(0, 140);
    if ((!kind && !trimmed) || this.state.status !== 'connected') return false;
    return this.send({ request: { kind, text: trimmed } });
  }
  private receiveRequest(message: any) {
    if (message.requestRejected) { this.requestFailed = true; this.requestListeners.forEach(fn => fn()); return; }
    this.requestFailed = false;
    const sent = message.requestSent, seen = message.requestAcknowledged;
    if (sent && Number.isInteger(sent.id) && typeof sent.text === 'string') {
      const kind = REQUEST_KINDS.some(entry => entry.kind === sent.kind) ? sent.kind as RequestKind : null;
      this.requests = [{ id: sent.id, kind, text: sent.text.slice(0, 140), at: Number.isFinite(sent.at) ? sent.at : Date.now(), acknowledged: false }, ...this.requests].slice(0, 10);
    } else if (seen && Number.isInteger(seen.id)) {
      this.requests = this.requests.map(entry => entry.id === seen.id ? { ...entry, acknowledged: true } : entry);
    } else return;
    this.requestListeners.forEach(fn => fn());
  }
  displayValue(channel: number): number | undefined {
    if (channel < 0) {
      const members = this.members(channel);
      if (!members || this.state.parameter !== 'level') return undefined;
      const values = members.map(id => this.displayValue(id));
      return values.every(value => value !== undefined) ? Math.max(...values as number[]) : undefined;
    }
    return this.state.values[channel] ?? this.valueCache[this.state.aux + ":" + this.state.parameter]?.[channel];
  }
  restoreValues(raw: unknown) {
    const cache: ValueCache = {};
    if (raw && typeof raw === "object") for (const [key, values] of Object.entries(raw).slice(0, 512)) {
      if (!/^[1-9]\d*:(level|pan)$/.test(key) || !values || typeof values !== "object") continue;
      const pan = key.endsWith(":pan");
      cache[key] = {};
      for (const [id, value] of Object.entries(values).slice(0, 1000)) {
        if (/^[1-9]\d*$/.test(id) && typeof value === "number" && Number.isFinite(value) && value >= (pan ? 0 : -150) && value <= (pan ? 1 : 10)) cache[key][Number(id)] = value;
      }
    }
    this.valueCache = cache;
    this.emit({});
  }
  private remember(channel: number, value: number, parameter: Parameter = this.state.parameter) {
    const key = this.state.aux + ":" + parameter;
    this.valueCache = { ...this.valueCache, [key]: { ...this.valueCache[key], [channel]: value } };
    this.cacheRevision++;
  }
  state: MixState = { peers: [], status: 'disconnected', config: null, aux: null, parameter: 'level', values: {}, epoch: 0, muted: {} };
  private socket: Socket | null = null;
  private url: string | null = null;
  private username: string | null = null;
  // Sent first on every connection, so the server can recognise this device
  // and, when it requires a connection PIN, check the device has paired.
  private access: { device: string | null; token: string | null } = { device: null, token: null };
  private denied: ((revoked: boolean) => void) | null = null;
  setAccess(device: string | null, token: string | null) { this.access = { device, token }; }
  onAccessDenied(listener: (revoked: boolean) => void) { this.denied = listener; }
  private desiredAux: number | null = null;
  private listeners = new Set<() => void>();
  // Signal meters are high-rate telemetry. They bypass emit() and React state:
  // each meter subscribes to its own channel and animates on the UI thread.
  private meterReadings = new Map<number, number | null>();
  private meterListeners = new Map<number, Set<(db: number | null) => void>>();
  private meterExpiry: ReturnType<typeof setTimeout> | null = null;
  onMeter(channel: number, fn: (db: number | null) => void) {
    let set = this.meterListeners.get(channel);
    if (!set) this.meterListeners.set(channel, set = new Set());
    set.add(fn);
    fn(this.meterReadings.get(channel) ?? null);
    return () => { set!.delete(fn); if (!set!.size) this.meterListeners.delete(channel); };
  }
  // Readings that stop arriving are stale, never shown as live.
  private clearMeters() {
    if (this.meterExpiry) clearTimeout(this.meterExpiry);
    this.meterExpiry = null;
    if (!this.meterReadings.size) return;
    this.meterReadings.clear();
    this.meterListeners.forEach(set => set.forEach(fn => fn(null)));
  }
  private receiveMeters(meters: any) {
    const config = this.state.config;
    if (!config?.meters || !meters || meters.kind !== config.meters || !Array.isArray(meters.levels)) return;
    const visible = new Set(config.channels.map(c => c.channel));
    for (const entry of meters.levels.slice(0, 512)) {
      if (!Array.isArray(entry) || !visible.has(entry[0])) continue;
      const db = entry[1] === null ? null : Number.isFinite(entry[1]) && entry[1] >= -150 && entry[1] <= 30 ? entry[1] as number : undefined;
      if (db === undefined || this.meterReadings.get(entry[0]) === db) continue;
      this.meterReadings.set(entry[0], db);
      this.meterListeners.get(entry[0])?.forEach(fn => fn(db));
    }
    if (this.meterExpiry) clearTimeout(this.meterExpiry);
    this.meterExpiry = setTimeout(() => this.clearMeters(), 800);
  }
  private controlListeners = new Set<() => void>();
  private controls: MixerControls = this.readControls();
  private channels = new Map<number, { snapshot: string; listeners: Set<() => void> }>();
  private readControls(): MixerControls { const { values: _values, muted: _muted, ...controls } = this.state; return controls; }
  controlsSnapshot = () => this.controls;
  subscribeControls = (fn: () => void) => { this.controlListeners.add(fn); return () => { this.controlListeners.delete(fn); }; };
  channelSnapshot(channel: number): string {
    const { status, epoch, aux, parameter, values } = this.state;
    return [status, epoch, aux, parameter, values[channel], this.displayValue(channel), this.isMuted(channel),
      ...(this.members(channel) || []).map(id => this.channelSnapshot(id))].join('|');
  }
  subscribeChannel(channel: number, fn: () => void) {
    let entry = this.channels.get(channel);
    if (!entry) { entry = { snapshot: this.channelSnapshot(channel), listeners: new Set() }; this.channels.set(channel, entry); }
    entry.listeners.add(fn);
    return () => { entry.listeners.delete(fn); if (!entry.listeners.size) this.channels.delete(channel); };
  }
  private retry: ReturnType<typeof setTimeout> | null = null;
  private query: ReturnType<typeof setTimeout> | null = null;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private activeDrags = new Map<number, DragToken>();
  private pending = new Map<number, { token: DragToken; value: number; timer: ReturnType<typeof setTimeout> }>();
  private attempt = 0;
  private queryGeneration = 0;
  constructor(private socketFactory: (url: string) => Socket) {}
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  private emit(update: Partial<MixState>) {
    this.state = { ...this.state, ...update };
    const changed = this.controls.status !== this.state.status || this.controls.config !== this.state.config ||
      this.controls.aux !== this.state.aux || this.controls.parameter !== this.state.parameter ||
      this.controls.epoch !== this.state.epoch || this.controls.peers !== this.state.peers;
    if (changed) this.controls = this.readControls();
    // Deliver positions before React's page/store subscribers. No polling or debounce.
    for (const [channel, entry] of this.channels) {
      const snapshot = this.channelSnapshot(channel);
      if (snapshot !== entry.snapshot) { entry.snapshot = snapshot; entry.listeners.forEach(fn => fn()); }
    }
    this.listeners.forEach(fn => fn());
    if (changed) this.controlListeners.forEach(fn => fn());
  }
  connect(url: string, preserveConfig = false) { this.disconnect(preserveConfig); this.url = url; this.attempt = 0; this.open(); }
  disconnect(preserveConfig = false) {
    this.url = null;
    this.clearMeters();
    this.liveLevels = {}; this.levelGeneration++;
    this.queryGeneration++;
    if (this.retry) clearTimeout(this.retry);
    if (this.timeout) clearTimeout(this.timeout);
    this.retry = this.timeout = null;
    this.cancelWrites();
    if (this.query) clearTimeout(this.query);
    const socket = this.socket; this.socket = null;
    if (socket) { socket.onclose = socket.onerror = socket.onmessage = socket.onopen = null; socket.close(); }
    if (!preserveConfig) this.valueCache = {};
    this.emit({ peers: [], status: 'disconnected', config: preserveConfig ? this.state.config : null, values: {}, muted: {}, aux: preserveConfig ? this.state.aux : null });
  }
  restoreConfig(config: MixerConfig, aux: number | null) {
    this.cancelWrites();
    this.emit({ config, aux: config.aux.find(a => a.channel === aux)?.channel ?? config.aux[0]?.channel ?? null, values: {} });
  }
  private open() {
    if (!this.url) return;
    this.liveLevels = {}; this.levelGeneration++;
    this.emit({ peers: [], status: 'connecting', values: {}, muted: {} });
    const socket = this.socketFactory(this.url.replace(/^http/, 'ws'));
    this.socket = socket;
    this.timeout = setTimeout(() => { if (this.socket === socket && this.state.status !== 'connected') this.lost(socket); }, 10000);
    socket.onopen = () => {
      if (this.socket !== socket) return;
      this.emit({ status: 'loading' });
      this.send({ auth: { ...this.access, name: this.username } });
      this.send({ username: this.username });
    };
    socket.onmessage = event => { if (this.socket === socket) this.receive(event.data); };
    socket.onclose = socket.onerror = () => this.lost(socket);
  }
  private lost(socket: Socket) {
    if (this.socket !== socket) return;
    this.queryGeneration++;
    socket.onclose = socket.onerror = socket.onmessage = socket.onopen = null; socket.close(); this.socket = null;
    if (this.timeout) clearTimeout(this.timeout);
    if (this.query) clearTimeout(this.query);
    this.cancelWrites();
    this.liveLevels = {};
    this.clearMeters();
    this.emit({ peers: [], status: this.url ? 'connecting' : 'disconnected', values: {}, muted: {} });
    if (this.url) this.retry = setTimeout(() => this.open(), Math.min(10000, 1000 * 2 ** this.attempt++));
  }
  private send(message: object) {
    if (this.socket?.readyState !== 1) return false;
    try { this.socket.send(JSON.stringify(message)); return true; }
    catch { this.lost(this.socket); return false; }
  }
  identify(name: string | null) { this.username = name; this.send({ username: name }); }
  selectAux(aux: number | null) {
    this.desiredAux = aux;
    const available = this.state.config?.aux || [];
    const selected = available.find(a => a.channel === aux)?.channel ?? available[0]?.channel ?? null;
    if (selected !== this.state.aux) { this.liveLevels = {}; this.emit({ aux: selected, peers: [], values: {}, muted: {} }); this.refresh(); }
  }
  setParameter(parameter: Parameter) {
    if (parameter !== this.state.parameter) { this.emit({ parameter, values: {} }); this.refresh(); }
  }
  setAllLevelsOff(expectedAux: number | null): boolean {
    const { aux, config } = this.state;
    if (!aux || aux !== expectedAux || !config || this.state.status !== 'connected' || this.socket?.readyState !== 1) return false;
    // Cancel older drag sends first so they cannot restore a level after setting sends to off.
    this.cancelWrites();
    const values = { ...this.state.values };
    let success = true;
    for (const channel of config.channels) {
      if (!this.send({ address: this.address(channel.channel, aux, 'level'), args: [-150] })) { success = false; break; }
      this.remember(channel.channel, -150, 'level');
      if (this.state.parameter === 'level') values[channel.channel] = -150;
    }
    if (success) { this.liveLevels = Object.fromEntries(config.channels.map(c => [c.channel, -150])); this.editedLevels(this.liveLevels); }
    this.emit(this.state.status === 'connected' ? { values } : {});
    return success;
  }
  cancelWrites() {
    for (const entry of this.pending.values()) clearTimeout(entry.timer);
    this.pending.clear();
    this.activeDrags.clear();
    this.emit({ epoch: this.state.epoch + 1 });
  }
  refresh() {
    this.liveLevels = {}; this.levelGeneration++;
    this.cancelWrites();
    if (this.query) clearTimeout(this.query);
    this.emit({ values: {} });
    if (!this.state.config || !this.state.aux || this.socket?.readyState !== 1) return;
    this.send({ selectedAux: this.state.aux });
    const generation = ++this.queryGeneration;
    const query = (attempt: number) => {
      const missing = this.state.config?.channels.filter(c => this.state.values[c.channel] === undefined || this.liveLevels[c.channel] === undefined) || [];
      let index = 0;
      const next = () => {
        if (generation !== this.queryGeneration || this.socket?.readyState !== 1) return;
        const channel = missing[index++];
        if (channel) {
          this.send({ address: this.address(channel.channel) + '/?', args: [] });
          if (this.state.parameter !== 'level') this.send({ address: this.address(channel.channel, this.state.aux, 'level') + '/?', args: [] });
          if (this.state.muted[channel.channel] === undefined) this.send({ address: this.address(channel.channel, this.state.aux, 'on') + '/?', args: [] });
          this.query = setTimeout(next, 12);
        } else if (attempt < 3 && this.state.config?.channels.some(c => this.state.values[c.channel] === undefined || this.liveLevels[c.channel] === undefined)) {
          this.query = setTimeout(() => query(attempt + 1), 1000);
        }
      };
      next();
    };
    query(0);
  }
  private address(channel: number, aux = this.state.aux, parameter: Parameter | 'on' = this.state.parameter) {
    return '/Input_Channels/' + channel + '/Aux_Send/' + aux + '/send_' + parameter;
  }
  beginDrag(channel: number): DragToken | null {
    if (!this.canDrag(channel)) return null;
    const members = this.members(channel);
    if ((members || [channel]).some(id => this.activeDrags.has(id))) return null;
    const token: DragToken = { epoch: this.state.epoch, channel, aux: this.state.aux!, parameter: this.state.parameter };
    if (members) {
      const key = groupKey(token.aux, members), previous = this.balances[key];
      const balance = previous && members.every(id => Math.abs(previous.expected[id] - this.liveLevels[id]) < 0.1)
        ? previous : captureBalance(members, this.liveLevels);
      token.members = members; token.balance = balance;
      this.balances[key] = balance;
      for (const id of members) this.activeDrags.set(id, token);
    }
    this.activeDrags.set(channel, token);
    return token;
  }
  private valid(token: DragToken) {
    return token.epoch === this.state.epoch && token.aux === this.state.aux && token.parameter === this.state.parameter &&
      this.canDrag(token.channel) && this.activeDrags.get(token.channel) === token;
  }
  drag(token: DragToken, position: number) {
    if (!this.valid(token) || !Number.isFinite(position)) return;
    const value = token.parameter === 'level' ? dragLevel(clamp(position)) : clamp(position);
    // Update the model immediately, but publish at the network cadence so
    // every pointer event does not re-render the entire channel bank.
    const levels = token.balance ? groupLevels(token.balance, value) : { [token.channel]: value };
    this.state = { ...this.state, values: { ...this.state.values, ...levels } };
    const previous = this.pending.get(token.channel);
    if (previous) { previous.value = value; return; }
    this.pending.set(token.channel, { token, value, timer: setTimeout(() => this.flush(token), 35) });
  }
  flush(token: DragToken) {
    const entry = this.pending.get(token.channel);
    if (!entry || entry.token !== token) return;
    clearTimeout(entry.timer); this.pending.delete(token.channel);
    if (!this.valid(token)) return;
    const levels = token.balance ? groupLevels(token.balance, entry.value) : { [token.channel]: entry.value };
    const applied: Record<number, number> = {};
    for (const [id, value] of Object.entries(levels)) {
      if (!this.send({ address: this.address(Number(id), token.aux, token.parameter), args: [value] })) return;
      this.remember(Number(id), value); applied[Number(id)] = value;
    }
    if (token.balance && token.members) {
      this.balances[groupKey(token.aux, token.members)] = { offsets: { ...token.balance.offsets }, expected: { ...applied } };
    }
    if (token.parameter === 'level') { this.liveLevels = { ...this.liveLevels, ...applied }; this.editedLevels(applied); }
    this.emit({});
  }
  cancelDrag(token: DragToken) {
    for (const id of token.members || []) if (this.activeDrags.get(id) === token) this.activeDrags.delete(id);
    if (this.activeDrags.get(token.channel) === token) this.activeDrags.delete(token.channel);
    const entry = this.pending.get(token.channel);
    if (entry?.token === token) { clearTimeout(entry.timer); this.pending.delete(token.channel); }
  }
  private receive(raw: unknown) {
    let message: any;
    try { message = JSON.parse(String(raw)); } catch { return; }
    if (!message || typeof message !== 'object') return;
    // The server needs the connection PIN, or signed this device out. Stop
    // reconnecting; the session asks for the PIN and reconnects once paired.
    if (message.auth === 'required' || message.auth === 'revoked') {
      this.disconnect(true);
      this.denied?.(message.auth === 'revoked');
      return;
    }
    if (message.meters) { this.receiveMeters(message.meters); return; }
    if (message.requestSent || message.requestAcknowledged || message.requestRejected) { this.receiveRequest(message); return; }
    if (message.presence) {
      const { aux, peers } = message.presence;
      if (aux !== this.state.aux || this.state.status !== 'connected' || !Array.isArray(peers)) return;
      const seen = new Set<string>();
      const valid: AuxPeer[] = [];
      for (const peer of peers.slice(0, 1000)) {
        if (!peer || typeof peer.id !== 'string' || !/^[1-9]\d{0,15}$/.test(peer.id) || seen.has(peer.id) ||
          !(peer.nickname === null || typeof peer.nickname === 'string' && peer.nickname.length <= 80)) continue;
        seen.add(peer.id); valid.push({ id: peer.id, nickname: peer.nickname?.trim() || null });
      }
      if (JSON.stringify(valid) !== JSON.stringify(this.state.peers)) this.emit({ peers: valid });
      return;
    }
    if (message.config) {
      const config = parseConfig(message.config);
      if (!config) return;
      if (this.timeout) clearTimeout(this.timeout);
      this.attempt = 0;
      this.cancelWrites();
      const aux = config.aux.find(a => a.channel === this.desiredAux)?.channel ?? config.aux[0]?.channel ?? null;
      this.clearMeters();
      this.emit({ peers: [], config, status: 'connected', aux, values: {}, muted: {} }); this.refresh();
      // Ask for meters only when the server has them. The app disconnects in
      // the background, which also ends the stream.
      if (config.meters) this.send({ meters: true });
      return;
    }
    if (!Array.isArray(message.args) || typeof message.address !== 'string') return;
    if (message.address === '/MixReload') { this.refresh(); return; }
    const config = this.state.config;
    if (message.address === '/SnapshotName' && config) {
      this.emit({ config: { ...config, snapshot: String(message.args[0] || '') } }); return;
    }
    const on = /^\/Input_Channels\/(\d+)\/Aux_Send\/(\d+)\/send_on$/.exec(message.address);
    if (on) {
      const channel = Number(on[1]), value = message.args[0];
      if (Number(on[2]) !== this.state.aux || !config?.channels.some(c => c.channel === channel) || !(value === 0 || value === 1 || typeof value === 'boolean')) return;
      const muted = !value;
      if (this.state.muted[channel] !== muted) this.emit({ muted: { ...this.state.muted, [channel]: muted } });
      return;
    }
    const match = /^\/Input_Channels\/(\d+)\/Aux_Send\/(\d+)\/send_(level|pan)$/.exec(message.address);
    if (match) {
      const value = message.args[0], channel = Number(match[1]);
      if (Number(match[2]) !== this.state.aux || (match[3] !== this.state.parameter && match[3] !== 'level') ||
        !config?.channels.some(c => c.channel === channel) || !Number.isFinite(value) ||
        (match[3] === 'level' ? value < -150 || value > 10 : value < 0 || value > 1)) return;
      if (this.activeDrags.has(channel) || this.pending.has(channel)) return;
      if (match[3] === 'level') this.liveLevels = { ...this.liveLevels, [channel]: value };
      this.remember(channel, value, match[3] as Parameter);
      if (match[3] !== this.state.parameter) { this.emit({}); return; }
      this.emit({ values: { ...this.state.values, [channel]: value } });
      return;
    }
    const channelName = /^\/Input_Channels\/(\d+)\/Channel_Input\/name$/.exec(message.address);
    const auxName = /^\/Aux_Outputs\/(\d+)\/Buss_Trim\/name$/.exec(message.address);
    if (config && channelName) this.emit({ config: { ...config, channels: config.channels.map(c => c.channel === Number(channelName[1]) ? { ...c, label: String(message.args[0] || 'Channel ' + c.channel) } : c) } });
    if (config && auxName) this.emit({ config: { ...config, aux: config.aux.map(a => a.channel === Number(auxName[1]) ? { ...a, label: String(message.args[0] || 'Mix ' + a.channel) } : a) } });
  }
  position(channel: number) {
    const value = this.displayValue(channel);
    return value === undefined ? 0 : this.state.parameter === 'level' ? dbToPosition(value) : value;
  }
}
