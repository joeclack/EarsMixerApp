import { clamp, dbToPosition, parseConfig, positionToDb, type MixerConfig, type Parameter } from './model';

export interface Socket {
  readyState: number;
  onopen: (() => void) | null; onclose: (() => void) | null;
  onerror: (() => void) | null; onmessage: ((event: { data: any }) => void) | null;
  send(value: string): void; close(): void;
}
export type MixState = {
  status: 'disconnected' | 'connecting' | 'loading' | 'connected';
  config: MixerConfig | null; aux: number | null; parameter: Parameter;
  values: Record<number, number>; epoch: number;
};
export type DragToken = { epoch: number; aux: number; channel: number; parameter: Parameter };
export class MixerClient {
  state: MixState = { status: 'disconnected', config: null, aux: null, parameter: 'level', values: {}, epoch: 0 };
  private socket: Socket | null = null;
  private url: string | null = null;
  private username: string | null = null;
  private desiredAux: number | null = null;
  private listeners = new Set<() => void>();
  private retry: ReturnType<typeof setTimeout> | null = null;
  private query: ReturnType<typeof setTimeout> | null = null;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private pending = new Map<number, { token: DragToken; value: number; timer: ReturnType<typeof setTimeout> }>();
  private attempt = 0;
  private queryGeneration = 0;
  constructor(private socketFactory: (url: string) => Socket) {}
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  private emit(update: Partial<MixState>) { this.state = { ...this.state, ...update }; this.listeners.forEach(fn => fn()); }
  connect(url: string) { this.disconnect(); this.url = url; this.attempt = 0; this.open(); }
  disconnect() {
    this.url = null;
    this.queryGeneration++;
    if (this.retry) clearTimeout(this.retry);
    if (this.timeout) clearTimeout(this.timeout);
    this.retry = this.timeout = null;
    this.cancelWrites();
    if (this.query) clearTimeout(this.query);
    const socket = this.socket; this.socket = null;
    if (socket) { socket.onclose = socket.onerror = socket.onmessage = socket.onopen = null; socket.close(); }
    this.emit({ status: 'disconnected', config: null, values: {}, aux: null });
  }
  private open() {
    if (!this.url) return;
    this.emit({ status: 'connecting', values: {} });
    const socket = this.socketFactory(this.url.replace(/^http/, 'ws'));
    this.socket = socket;
    this.timeout = setTimeout(() => { if (this.socket === socket && !this.state.config) this.lost(socket); }, 10000);
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
    this.emit({ status: this.url ? 'connecting' : 'disconnected', config: null, values: {} });
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
    if (selected !== this.state.aux) { this.emit({ aux: selected }); this.refresh(); }
  }
  setParameter(parameter: Parameter) {
    if (parameter !== this.state.parameter) { this.emit({ parameter }); this.refresh(); }
  }
  cancelWrites() {
    for (const entry of this.pending.values()) clearTimeout(entry.timer);
    this.pending.clear();
    this.emit({ epoch: this.state.epoch + 1 });
  }
  refresh() {
    this.cancelWrites();
    if (this.query) clearTimeout(this.query);
    this.emit({ values: {} });
    if (!this.state.config || !this.state.aux || this.socket?.readyState !== 1) return;
    this.send({ selectedAux: this.state.aux });
    const generation = ++this.queryGeneration;
    const query = (attempt: number) => {
      const missing = this.state.config?.channels.filter(c => this.state.values[c.channel] === undefined) || [];
      let index = 0;
      const next = () => {
        if (generation !== this.queryGeneration || this.socket?.readyState !== 1) return;
        const channel = missing[index++];
        if (channel) {
          this.send({ address: this.address(channel.channel) + '/?', args: [] });
          this.query = setTimeout(next, 12);
        } else if (attempt < 3 && this.state.config?.channels.some(c => this.state.values[c.channel] === undefined)) {
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
    return { epoch: this.state.epoch, channel, aux: this.state.aux, parameter: this.state.parameter };
  }
  private valid(token: DragToken) {
    return token.epoch === this.state.epoch && token.aux === this.state.aux && token.parameter === this.state.parameter &&
      this.state.status === 'connected' && this.socket?.readyState === 1 && this.state.values[token.channel] !== undefined;
  }
  drag(token: DragToken, position: number) {
    if (!this.valid(token) || !Number.isFinite(position)) return;
    const value = token.parameter === 'level' ? positionToDb(clamp(position)) : clamp(position);
    this.emit({ values: { ...this.state.values, [token.channel]: value } });
    const previous = this.pending.get(token.channel);
    if (previous) { previous.value = value; return; }
    this.pending.set(token.channel, { token, value, timer: setTimeout(() => this.flush(token), 35) });
  }
  flush(token: DragToken) {
    const entry = this.pending.get(token.channel);
    if (!entry || entry.token !== token) return;
    clearTimeout(entry.timer); this.pending.delete(token.channel);
    if (this.valid(token)) this.send({ address: this.address(token.channel, token.aux, token.parameter), args: [entry.value] });
  }
  cancelDrag(token: DragToken) {
    const entry = this.pending.get(token.channel);
    if (entry?.token === token) { clearTimeout(entry.timer); this.pending.delete(token.channel); }
  }
  private receive(raw: unknown) {
    let message: any;
    try { message = JSON.parse(String(raw)); } catch { return; }
    if (!message || typeof message !== 'object') return;
    if (message.config) {
      const config = parseConfig(message.config);
      if (!config) return;
      if (this.timeout) clearTimeout(this.timeout);
      this.attempt = 0;
      this.cancelWrites();
      const aux = config.aux.find(a => a.channel === this.desiredAux)?.channel ?? config.aux[0]?.channel ?? null;
      this.emit({ config, status: 'connected', aux, values: {} }); this.refresh(); return;
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
      if (Number(match[2]) !== this.state.aux || match[3] !== this.state.parameter ||
        !config?.channels.some(c => c.channel === channel) || !Number.isFinite(value) ||
        (match[3] === 'level' ? value < -150 || value > 10 : value < 0 || value > 1)) return;
      if (!this.pending.has(channel)) this.emit({ values: { ...this.state.values, [channel]: value } });
      return;
    }
    const channelName = /^\/Input_Channels\/(\d+)\/Channel_Input\/name$/.exec(message.address);
    const auxName = /^\/Aux_Outputs\/(\d+)\/Buss_Trim\/name$/.exec(message.address);
    if (config && channelName) this.emit({ config: { ...config, channels: config.channels.map(c => c.channel === Number(channelName[1]) ? { ...c, label: String(message.args[0] || 'Channel ' + c.channel) } : c) } });
    if (config && auxName) this.emit({ config: { ...config, aux: config.aux.map(a => a.channel === Number(auxName[1]) ? { ...a, label: String(message.args[0] || 'Mix ' + a.channel) } : a) } });
  }
  position(channel: number) {
    const value = this.state.values[channel];
    return value === undefined ? 0 : this.state.parameter === 'level' ? dbToPosition(value) : value;
  }
}
