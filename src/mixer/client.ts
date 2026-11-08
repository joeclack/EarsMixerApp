import { clamp, dbToPosition, parseConfig, positionToDb, type MixerConfig, type Parameter } from './model';

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
};
export type MixerControls = Omit<MixState, 'values'>;
export type DragToken = { epoch: number; aux: number; channel: number; parameter: Parameter };
export type ValueCache = Record<string, Record<number, number>>;
export class MixerClient {
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
  displayValue(channel: number) { return this.state.values[channel] ?? this.valueCache[this.state.aux + ":" + this.state.parameter]?.[channel]; }
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
  state: MixState = { peers: [], status: 'disconnected', config: null, aux: null, parameter: 'level', values: {}, epoch: 0 };
  private socket: Socket | null = null;
  private url: string | null = null;
  private username: string | null = null;
  private desiredAux: number | null = null;
  private listeners = new Set<() => void>();
  private controlListeners = new Set<() => void>();
  private controls: MixerControls = this.readControls();
  private channels = new Map<number, { snapshot: string; listeners: Set<() => void> }>();
  private readControls(): MixerControls { const { values: _values, ...controls } = this.state; return controls; }
  controlsSnapshot = () => this.controls;
  subscribeControls = (fn: () => void) => { this.controlListeners.add(fn); return () => { this.controlListeners.delete(fn); }; };
  channelSnapshot(channel: number) {
    const { status, epoch, aux, parameter, values } = this.state;
    return [status, epoch, aux, parameter, values[channel], this.displayValue(channel)].join('|');
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
    this.emit({ peers: [], status: 'disconnected', config: preserveConfig ? this.state.config : null, values: {}, aux: preserveConfig ? this.state.aux : null });
  }
  restoreConfig(config: MixerConfig, aux: number | null) {
    this.cancelWrites();
    this.emit({ config, aux: config.aux.find(a => a.channel === aux)?.channel ?? config.aux[0]?.channel ?? null, values: {} });
  }
  private open() {
    if (!this.url) return;
    this.liveLevels = {}; this.levelGeneration++;
    this.emit({ peers: [], status: 'connecting', values: {} });
    const socket = this.socketFactory(this.url.replace(/^http/, 'ws'));
    this.socket = socket;
    this.timeout = setTimeout(() => { if (this.socket === socket && this.state.status !== 'connected') this.lost(socket); }, 10000);
    socket.onopen = () => { if (this.socket === socket) { this.emit({ status: 'loading' }); this.send({ username: this.username }); } };
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
    this.emit({ peers: [], status: this.url ? 'connecting' : 'disconnected', values: {} });
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
    if (selected !== this.state.aux) { this.liveLevels = {}; this.emit({ aux: selected, peers: [], values: {} }); this.refresh(); }
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
          this.query = setTimeout(next, 12);
        } else if (attempt < 3 && this.state.config?.channels.some(c => this.state.values[c.channel] === undefined || this.liveLevels[c.channel] === undefined)) {
          this.query = setTimeout(() => query(attempt + 1), 1000);
        }
      };
      next();
    };
    query(0);
  }
  private address(channel: number, aux = this.state.aux, parameter = this.state.parameter) {
    return '/Input_Channels/' + channel + '/Aux_Send/' + aux + '/send_' + parameter;
  }
  beginDrag(channel: number): DragToken | null {
    if (this.state.status !== 'connected' || !this.state.aux || this.state.values[channel] === undefined ||
      !this.state.config?.channels.some(c => c.channel === channel)) return null;
    const token = { epoch: this.state.epoch, channel, aux: this.state.aux, parameter: this.state.parameter };
    this.activeDrags.set(channel, token);
    return token;
  }
  private valid(token: DragToken) {
    return token.epoch === this.state.epoch && token.aux === this.state.aux && token.parameter === this.state.parameter &&
      this.state.status === 'connected' && this.socket?.readyState === 1 && this.state.values[token.channel] !== undefined;
  }
  drag(token: DragToken, position: number) {
    if (!this.valid(token) || !Number.isFinite(position)) return;
    const value = token.parameter === 'level' ? positionToDb(clamp(position)) : clamp(position);
    // Update the model immediately, but publish at the network cadence so
    // every pointer event does not re-render the entire channel bank.
    this.state = { ...this.state, values: { ...this.state.values, [token.channel]: value } };
    const previous = this.pending.get(token.channel);
    if (previous) { previous.value = value; return; }
    this.pending.set(token.channel, { token, value, timer: setTimeout(() => this.flush(token), 35) });
  }
  flush(token: DragToken) {
    const entry = this.pending.get(token.channel);
    if (!entry || entry.token !== token) return;
    clearTimeout(entry.timer); this.pending.delete(token.channel);
    if (this.valid(token) && this.send({ address: this.address(token.channel, token.aux, token.parameter), args: [entry.value] })) { this.remember(token.channel, entry.value); if (token.parameter === 'level') { this.liveLevels[token.channel] = entry.value; this.editedLevels({ [token.channel]: entry.value }); } this.emit({}); }
  }
  cancelDrag(token: DragToken) {
    if (this.activeDrags.get(token.channel) === token) this.activeDrags.delete(token.channel);
    const entry = this.pending.get(token.channel);
    if (entry?.token === token) { clearTimeout(entry.timer); this.pending.delete(token.channel); }
  }
  private receive(raw: unknown) {
    let message: any;
    try { message = JSON.parse(String(raw)); } catch { return; }
    if (!message || typeof message !== 'object') return;
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
      this.emit({ peers: [], config, status: 'connected', aux, values: {} }); this.refresh(); return;
    }
    if (!Array.isArray(message.args) || typeof message.address !== 'string') return;
    if (message.address === '/MixReload') { this.refresh(); return; }
    const config = this.state.config;
    if (message.address === '/SnapshotName' && config) {
      this.emit({ config: { ...config, snapshot: String(message.args[0] || '') } }); return;
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
