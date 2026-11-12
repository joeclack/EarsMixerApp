import { readLevelStates, stateKey, type SavedLevelState } from './recentStates';
import { normalizeMixerAddress, probeMixer, readSavedMixers, rememberMixer, type SavedMixer } from '../connection';
import { requestTemplates, templatePreferences, type MixerTemplate } from './templates';
import { DEMO_URL, createDemoSocket, demoTemplates, demoTemplate } from './demo';
import { MixerClient, type Socket } from './client';
import { emptyPreferences, readPreferences, type GroupScope, type Preferences, parseConfig, hiddenChannels, groupsForAux } from './model';
import { contiguousGroupOrder, layoutChannelOrder, layoutItems, replaceLayoutGroup } from './layout';
import { moveGroupMembers } from './groups';
type Storage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; getAllKeys?(): Promise<readonly string[]>; multiRemove?(keys: string[]): Promise<void> };
export type Settings = { appearance: 'system' | 'light' | 'dark'; nickname: string; haptics: boolean };
export type SessionState = {
  confirmation: { id: number; message: string } | null;
  recentStates: Record<string, SavedLevelState>; restorePrompt: { key: string; generation: number; saved: SavedLevelState } | null;
  selectedTemplate: MixerTemplate | null; hydrated: boolean; demo: boolean; setupComplete: boolean; lastServer: string | null; server: string | null; recent: SavedMixer[]; settings: Settings;
  preferences: Preferences; connecting: boolean; message: string;
  // Set while the connected mixer is waiting for its connection PIN.
  pinPrompt: { revoked: boolean } | null;
};
export class MixerSession {
  readonly mixer: MixerClient;
  state: SessionState = { confirmation: null, recentStates: {}, restorePrompt: null, selectedTemplate: null, hydrated: false, demo: false, setupComplete: false, lastServer: null, server: null, recent: [], settings: { appearance: 'system', nickname: '', haptics: true },
    preferences: emptyPreferences(), connecting: false, message: '', pinPrompt: null };
  private listeners = new Set<() => void>();
  private attempt = 0;
  private confirmationSequence = 0;
  notifySuccess(message: string) { this.patch({ confirmation: { id: ++this.confirmationSequence, message } }); }
  dismissConfirmation(id: number) {
    if (this.state.confirmation?.id === id) this.patch({ confirmation: null });
  }
  private suspended = false;
  private statesLoaded: Promise<void> | null = null;
  private compared = '';
  private comparisonTarget = '';
  private loadLevelStates() {
    return this.statesLoaded ??= this.storage.getItem('earsmixer.native.level-states.v1').then(raw => {
      this.patch({ recentStates: readLevelStates(raw) });
    });
  }
  private saveLevelState(aux: number, changes: Record<number, number>, initial = false) {
    const { server } = this.state, config = this.mixer.state.config;
    if (!server || !config || !Object.keys(changes).length) return;
    const key = stateKey(server, aux), previous = this.state.recentStates[key];
    const saved: SavedLevelState = { server, aux, name: config.aux.find(a => a.channel === aux)?.label || 'AUX ' + aux,
      editedAt: Date.now(), levels: { ...previous?.levels, ...this.mixer.liveLevels, ...changes },
      labels: Object.fromEntries(config.channels.map(c => [c.channel, c.label])) };
    this.patch({ recentStates: { ...this.state.recentStates, [key]: saved } });
    // Coalesce drag writes with the existing on-device cache timer.
    if (initial) void this.persist('earsmixer.native.level-states.v1', this.state.recentStates);
    else if (!this.valueTimer) this.valueTimer = setTimeout(() => this.persistValues(), 350);
  }
  private compareLevelState() {
    const { server } = this.state, { aux, config, status } = this.mixer.state;
    if (!server || !aux || !config || status !== 'connected') {
      this.compared = '';
      if (this.state.restorePrompt) this.patch({ restorePrompt: null });
      return;
    }
    const key = stateKey(server, aux), generation = this.mixer.levelGeneration;
    if (this.comparisonTarget !== key) { this.comparisonTarget = key; this.compared = ''; }
    const comparison = key;
    if (this.state.restorePrompt && (this.state.restorePrompt.key !== key || this.state.restorePrompt.generation !== generation)) this.patch({ restorePrompt: null });
    if (this.compared === comparison || !config.channels.length || config.channels.some(c => this.mixer.liveLevels[c.channel] === undefined)) return;
    this.compared = comparison;
    let saved = this.state.recentStates[key];
    if (!saved) { this.saveLevelState(aux, this.mixer.liveLevels, true); return; }
    if (config.channels.some(c => saved.levels[c.channel] === undefined)) {
      saved = { ...saved, levels: { ...this.mixer.liveLevels, ...saved.levels }, labels: Object.fromEntries(config.channels.map(c => [c.channel, c.label])) };
      this.patch({ recentStates: { ...this.state.recentStates, [key]: saved } });
      void this.persist('earsmixer.native.level-states.v1', this.state.recentStates);
    }
    const differs = config.channels.some(c => saved.levels[c.channel] !== undefined && Math.abs(saved.levels[c.channel] - this.mixer.liveLevels[c.channel]) > 0.05);
    if (differs) this.patch({ restorePrompt: { key, generation, saved } });
  }
  resolveLevelRestore(prompt: NonNullable<SessionState['restorePrompt']>, restore: boolean) {
    if (this.state.restorePrompt !== prompt) return;
    this.patch({ restorePrompt: null });
    if (restore && this.state.server === prompt.saved.server && this.mixer.state.aux === prompt.saved.aux && this.mixer.levelGeneration === prompt.generation) {
      if (this.mixer.restoreLevels(prompt.saved.aux, prompt.saved.levels)) this.notifySuccess('Saved levels loaded');
      else this.patch({ message: 'Could not restore all levels. Check the mixer connection.' });
    }
  }
  private queue = Promise.resolve();
  private profileWrite: Promise<boolean> = Promise.resolve(true);
  private valueTimer: ReturnType<typeof setTimeout> | null = null;
  private persistValues() {
    if (this.valueTimer) clearTimeout(this.valueTimer);
    this.valueTimer = null;
    void this.persist('earsmixer.native.level-states.v1', this.state.recentStates);
    if (this.state.server) {
      void this.persist("earsmixer.native.values:" + this.state.server, this.mixer.getValueCache());
      void this.persist('earsmixer.native.group-balances:' + this.state.server, this.mixer.getGroupBalances());
    }
  }
  constructor(private storage: Storage, factory: (url: string) => Socket, private fetcher: typeof fetch = fetch) {
    this.mixer = new MixerClient(url => url === DEMO_URL.replace(/^http/, 'ws') ? createDemoSocket() : factory(url));
    this.mixer.onLevelEdit((aux, levels) => this.saveLevelState(aux, levels));
    this.mixer.onAccessDenied(revoked => this.accessDenied(revoked));
    let previous: unknown = null;
    let revision = 0;
    this.mixer.subscribe(() => {
      this.compareLevelState();
      const { config, status } = this.mixer.state;
      if (this.mixer.cacheRevision !== revision) {
        revision = this.mixer.cacheRevision;
        if (!this.valueTimer) this.valueTimer = setTimeout(() => this.persistValues(), 350);
      }
      if (status === 'connected' && config && config !== previous && this.state.server) {
        previous = config;
        void this.persist('earsmixer.native.channels:' + this.state.server, config);
      }
    });
  }
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  snapshot = () => this.state;
  private patch(update: Partial<SessionState>) { this.state = { ...this.state, ...update }; this.listeners.forEach(fn => fn()); }
  async hydrate() {
    try {
      await this.loadLevelStates();
      const [recent, raw, last, setup] = await Promise.all([this.storage.getItem('earsmixer.connections.v1'), this.storage.getItem('earsmixer.native.settings.v1'), this.storage.getItem('earsmixer.native.last-server.v1'), this.storage.getItem('earsmixer.native.setup.v1')]);
      let settings: Partial<Settings> = {};
      try { settings = JSON.parse(raw || '{}') || {}; } catch {}
      let lastServer: string | null = null;
      try { const saved = JSON.parse(last || 'null'); if (typeof saved === 'string') lastServer = normalizeMixerAddress(saved); } catch {}
      this.patch({ setupComplete: setup === 'true', lastServer, recent: readSavedMixers(recent), settings: {
        appearance: settings.appearance === 'dark' || settings.appearance === 'light' ? settings.appearance : 'system',
        haptics: settings.haptics !== false,
        nickname: typeof settings.nickname === 'string' ? settings.nickname.slice(0, 80) : '',
      } });
    } catch { this.patch({ message: 'Could not load device settings.' }); }
    this.patch({ hydrated: true });
  }
  private persist(key: string, value: unknown) {
    const json = JSON.stringify(value);
    const write = this.queue.then(() => this.storage.setItem(key, json)).then(() => true, () => {
      this.patch({ message: 'Could not save to this device.' }); return false;
    });
    this.queue = write.then(() => {});
    return write;
  }
  async templates(signal?: AbortSignal): Promise<MixerTemplate[]> {
    if (!this.state.server) throw new Error('Connect to a mixer first.');
    if (this.state.demo) return demoTemplates;
    return requestTemplates(this.state.server, undefined, this.fetcher, signal);
  }
  async applyTemplate(id: string) {
    if (!this.state.server || !/^[a-f0-9]{64}$/.test(id)) throw new Error('Choose a template from the connected mixer.');
    const server = this.state.server, attempt = this.attempt;
    const data = this.state.demo ? { config: demoTemplate(id), name: demoTemplates.find(template => template.id === id)?.name } : await requestTemplates(server, id, this.fetcher);
    if (server !== this.state.server || attempt !== this.attempt) throw new Error('The mixer connection changed. Choose a template again.');
    const preferences = templatePreferences(data.config, this.state.preferences.compact);
    this.mixer.cancelWrites();
    this.patch({ selectedTemplate: typeof data.name === 'string' && data.name.trim() && data.name.length <= 80 ? { id, name: data.name.trim() } : null });
    this.preferences({ ...preferences, groupsByAux: this.state.preferences.groupsByAux, globalGroups: this.state.preferences.globalGroups });
    await this.queue;
    if (server === this.state.server && attempt === this.attempt) this.notifySuccess('Layout applied: ' + (this.state.selectedTemplate?.name || 'Template'));
  }
  async restartSetup() {
    this.mixer.cancelWrites();
    await this.persist('earsmixer.native.setup.v1', false);
    this.patch({ setupComplete: false });
  }
  async completeSetup() {
    await this.persist('earsmixer.native.setup.v1', true);
    this.patch({ setupComplete: true });
  }
  setSettings(settings: Partial<Settings>) {
    this.patch({ settings: { ...this.state.settings, ...settings } });
    this.mixer.identify(this.state.settings.nickname.trim() || null);
    void this.persist('earsmixer.native.settings.v1', this.state.settings);
  }
  async forget(url: string) {
    this.patch({ recent: this.state.recent.filter(item => item.url !== url) });
    await this.persist('earsmixer.connections.v1', this.state.recent);
  }
  // A stable ID for this installation, so a mixer recognises the device when
  // its IP address changes. It is an identifier rather than a secret: access
  // comes from the token a mixer issues after its connection PIN is entered.
  private async deviceId(): Promise<string> {
    let saved: unknown = null;
    try { saved = JSON.parse(await this.storage.getItem('earsmixer.native.device-id.v1') || 'null'); } catch {}
    if (typeof saved === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(saved)) return saved;
    const bytes = new Uint8Array(16);
    const random = (globalThis as { crypto?: { getRandomValues?(values: Uint8Array): unknown } }).crypto;
    if (random?.getRandomValues) random.getRandomValues(bytes);
    else for (let index = 0; index < bytes.length; index++) bytes[index] = Math.floor(Math.random() * 256);
    const id = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    await this.persist('earsmixer.native.device-id.v1', id);
    return id;
  }
  private async accessToken(server: string): Promise<string | null> {
    try {
      const token = JSON.parse(await this.storage.getItem('earsmixer.native.access:' + server) || 'null');
      return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token) ? token : null;
    } catch { return null; }
  }
  private accessDenied(revoked: boolean) {
    const server = this.state.server;
    if (!server || this.state.demo) return;
    // The saved token no longer works; forget it and ask for the PIN.
    void this.persist('earsmixer.native.access:' + server, null);
    void this.deviceId().then(device => { if (server === this.state.server) this.mixer.setAccess(device, null); });
    this.patch({ pinPrompt: { revoked }, connecting: false });
  }
  // Pair this device using the mixer's connection PIN, then reconnect.
  async pair(pin: string) {
    const server = this.state.server;
    if (!server || this.state.demo) return;
    const device = await this.deviceId();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let response: Response;
    try {
      response = await this.fetcher(server + 'api/pair', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ pin, device, name: this.state.settings.nickname.trim() || null }) });
    } catch { throw new Error('Could not reach the mixer. Check your Wi-Fi and try again.'); }
    finally { clearTimeout(timeout); }
    let body: any = {};
    try { body = await response.json(); } catch {}
    if (!response.ok) throw new Error(typeof body?.error === 'string' && body.error.length <= 200 ? body.error : 'Could not check the PIN. Try again.');
    if (server !== this.state.server) return;
    const token = typeof body?.token === 'string' && /^[a-f0-9]{64}$/.test(body.token) ? body.token : null;
    await this.persist('earsmixer.native.access:' + server, token);
    this.mixer.setAccess(device, token);
    this.patch({ pinPrompt: null });
    if (!this.suspended) this.mixer.connect(server, true);
  }
  startDemo() { return this.connect(DEMO_URL); }
  async connect(input: string) {
    const attempt = ++this.attempt;
    this.compared = '';
    this.patch({ connecting: true, restorePrompt: null, message: '', pinPrompt: null });
    try {
      await this.loadLevelStates();
      const server = input === DEMO_URL ? DEMO_URL : await probeMixer(input, { fetchImpl: this.fetcher });
      this.persistValues();
      await this.queue;
      let raw: any = {};
      try { raw = JSON.parse(await this.storage.getItem('earsmixer.native.profile:' + server) || '{}') || {}; } catch {}
      let channels = null;
      try { channels = parseConfig(JSON.parse(await this.storage.getItem('earsmixer.native.channels:' + server) || 'null')); } catch {}
      let values: unknown = {};
      try { values = JSON.parse(await this.storage.getItem("earsmixer.native.values:" + server) || "{}"); } catch {}
      let balances: unknown = {};
      try { balances = JSON.parse(await this.storage.getItem('earsmixer.native.group-balances:' + server) || '{}'); } catch {}
      const device = server === DEMO_URL ? null : await this.deviceId();
      const token = server === DEMO_URL ? null : await this.accessToken(server);
      if (attempt !== this.attempt) return;
      this.mixer.setAccess(device, token);
      // Keep existing local guest layouts when upgrading. Never import account credentials.
      const preferences = readPreferences(raw.preferences) || readPreferences(raw.guest) || emptyPreferences();
      const selectedTemplate = typeof raw.template?.id === 'string' && /^[a-f0-9]{64}$/.test(raw.template.id) && typeof raw.template.name === 'string' && raw.template.name.length <= 80 ? { id: raw.template.id, name: raw.template.name } : null;
      this.mixer.disconnect();
      this.mixer.configureGroups(preferences.groupsByAux, preferences.globalGroups);
      this.mixer.restoreGroupBalances(balances);
      this.patch({ selectedTemplate, server, demo: server === DEMO_URL, preferences, recent: server === DEMO_URL ? this.state.recent : rememberMixer(this.state.recent, server) });
      this.mixer.restoreValues(values);
      if (channels) this.mixer.restoreConfig(channels, preferences.selectedAux);
      this.mixer.selectAux(preferences.selectedAux);
      this.mixer.identify(this.state.settings.nickname.trim() || null);
      if (!this.suspended) this.mixer.connect(server, true);
      await this.persist('earsmixer.connections.v1', this.state.recent);
      if (attempt === this.attempt && server !== DEMO_URL) {
        this.patch({ lastServer: server });
        await this.persist('earsmixer.native.last-server.v1', server);
      }
    } catch (error) {
      if (attempt === this.attempt) { this.patch({ message: error instanceof Error ? error.message : 'Could not connect.' }); throw error; }
    } finally { if (attempt === this.attempt) this.patch({ connecting: false }); }
  }
  disconnect(forgetConnection = true) {
    this.persistValues();
    if (forgetConnection && !this.state.demo) { this.patch({ lastServer: null }); void this.persist('earsmixer.native.last-server.v1', null); }
    ++this.attempt; this.mixer.disconnect();
    this.patch({ confirmation: null, restorePrompt: null, selectedTemplate: null, server: null, demo: false, connecting: false, preferences: emptyPreferences(), message: '', pinPrompt: null });
  }
  setChannelHidden(channel: number, hidden: boolean) {
    this.setChannelsHidden([channel], hidden);
  }
  private setChannelsHidden(members: number[], hidden: boolean) {
    const aux = this.mixer.state.aux;
    if (aux === null) return;
    const previous = hiddenChannels(this.mixer.state.config, this.state.preferences, aux);
    const channels = hidden ? [...new Set([...previous, ...members])] : previous.filter(id => !members.includes(id));
    this.mixer.cancelWrites();
    this.preferences({ hiddenByAux: { ...this.state.preferences.hiddenByAux, [aux]: channels } });
  }
  setLayoutItemHidden(key: number, hidden: boolean, scope: GroupScope) {
    if (this.state.server !== scope.server || this.mixer.state.aux !== scope.aux) return;
    const item = layoutItems(this.mixer.state.config, this.state.preferences, scope.aux).find(item => item.key === key);
    if (item) this.setChannelsHidden(item.members, hidden);
  }
  moveLayoutItems(keys: number[], indices: number[], destination: number, scope: GroupScope) {
    if (this.state.server !== scope.server || this.mixer.state.aux !== scope.aux) return;
    const items = layoutItems(this.mixer.state.config, this.state.preferences, scope.aux);
    if (keys.length !== items.length || !items.every((item, index) => item.key === keys[index])) return;
    const moved = moveGroupMembers(items.map((_item, index) => index), indices, destination);
    if (moved.every((index, position) => index === position)) return;
    const ids = moved.flatMap(index => items[index].members);
    const retained = layoutChannelOrder(this.mixer.state.config, this.state.preferences, scope.aux).filter(id => !ids.includes(id));
    this.mixer.cancelWrites();
    this.preferences({ channelOrder: [...ids, ...retained] });
  }
  preferences(update: Partial<Preferences>) {
    const preferences = readPreferences({ ...this.state.preferences, ...update });
    if (!preferences) return;
    if ('groupsByAux' in update || 'globalGroups' in update) this.mixer.configureGroups(preferences.groupsByAux, preferences.globalGroups);
    this.patch({ preferences });
    if ('selectedAux' in update) this.mixer.selectAux(preferences.selectedAux);
    if (this.state.server) {
      const write = this.persist('earsmixer.native.profile:' + this.state.server, { preferences, template: this.state.selectedTemplate });
      this.profileWrite = write;
      void write.then(saved => {
        if (saved && this.profileWrite === write && this.state.message === 'Could not save to this device.') this.patch({ message: '' });
      });
    }
  }
  saveGroup(id: number | null, name: string, members: number[], scope?: GroupScope, allAuxes?: boolean): number | null {
    const { aux, config } = this.mixer.state;
    if (!this.state.server || !aux || (scope && (scope.server !== this.state.server || scope.aux !== aux)) ||
      typeof name !== 'string' || name.length > 80 || !Array.isArray(members) || members.length < 2 || members.length > 1000 ||
      !members.every(member => Number.isSafeInteger(member) && member > 0) || new Set(members).size !== members.length) return null;
    const preferences = this.state.preferences;
    const local = preferences.groupsByAux[String(aux)] || [];
    const global = preferences.globalGroups;
    const wasGlobal = id !== null && global.some(group => group.id === id);
    const previous = id === null ? undefined : groupsForAux(preferences, aux).find(group => group.id === id);
    if (id !== null && !previous) return null;
    if (!members.every(member => previous?.members.includes(member) || config?.channels.some(c => c.channel === member))) return null;
    const applyAll = allAuxes ?? wasGlobal;
    const otherLocal = Object.entries(preferences.groupsByAux).flatMap(([key, entries]) =>
      (applyAll || Number(key) === aux) ? entries.filter(group => !(Number(key) === aux && !wasGlobal && group.id === id)) : []);
    if ([...global.filter(group => group.id !== id), ...otherLocal].some(group => group.members.some(member => members.includes(member)))) return null;
    let nextId = id ?? Math.max(1, Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
    const allGroups = [...global, ...Object.values(preferences.groupsByAux).flat()];
    if (id === null) while (allGroups.some(group => group.id === nextId)) nextId = nextId === Number.MAX_SAFE_INTEGER ? 1 : nextId + 1;
    const next = { id: nextId, name: name.trim(), members: [...members] };
    const added = applyAll && !wasGlobal ? members : members.filter(member => !previous?.members.includes(member));
    const hiddenByAux = { ...preferences.hiddenByAux };
    const affected = applyAll ? new Set([aux, ...(config?.aux.map(entry => entry.channel) || []), ...Object.keys(preferences.hiddenByAux).map(Number), ...Object.keys(preferences.favouritesByAux).map(Number)]) : new Set([aux]);
    for (const affectedAux of affected) hiddenByAux[affectedAux] = hiddenChannels(config, preferences, affectedAux).filter(member => !added.includes(member));
    const membershipChanged = !previous || previous.members.length !== members.length || previous.members.some((member, index) => member !== members[index]);
    const update = { ...(membershipChanged ? { channelOrder: replaceLayoutGroup(contiguousGroupOrder(config, preferences, aux), previous?.members || [], members) } : {}),
      globalGroups: applyAll ? wasGlobal ? global.map(group => group.id === id ? next : group) : [...global, next] : global.filter(group => group.id !== id),
      groupsByAux: { ...preferences.groupsByAux, [aux]: applyAll ? local.filter(group => group.id !== id) : previous && !wasGlobal ? local.map(group => group.id === id ? next : group) : [...local, next] }, hiddenByAux };
    if (!readPreferences({ ...this.state.preferences, ...update })) return null;
    this.preferences(update);
    return nextId;
  }
  createGroup(members: number[], name = '') { return this.saveGroup(null, name, members) !== null; }
  deleteGroups(ids: number[], scope?: GroupScope): boolean {
    const aux = this.mixer.state.aux;
    if (!this.state.server || !aux || !ids.length || (scope && (scope.server !== this.state.server || scope.aux !== aux))) return false;
    const groups = groupsForAux(this.state.preferences, aux);
    if (!ids.every(id => groups.some(group => group.id === id))) return false;
    this.preferences({ channelOrder: contiguousGroupOrder(this.mixer.state.config, this.state.preferences, aux),
      globalGroups: this.state.preferences.globalGroups.filter(group => !ids.includes(group.id)),
      groupsByAux: { ...this.state.preferences.groupsByAux,
      [aux]: (this.state.preferences.groupsByAux[String(aux)] || []).filter(group => !ids.includes(group.id)) } });
    return true;
  }
  removeGroup(id: number) { return this.deleteGroups([id]); }
  private async commitGroupChange<T>(scope: GroupScope, change: () => T, failure: T): Promise<T> {
    const before = this.state.preferences, balances = this.mixer.getGroupBalances();
    const result = change();
    if (result === failure) return failure;
    const after = this.state.preferences;
    if (!await this.profileWrite) {
      // Retain drafts and restore the layout if the device rejected the write.
      // Never overwrite newer edits or another mixer's profile during recovery.
      if (this.state.server === scope.server && this.state.preferences === after) {
        this.mixer.configureGroups(before.groupsByAux, before.globalGroups);
        this.mixer.restoreGroupBalances(balances);
        this.patch({ preferences: before });
      }
      return failure;
    }
    return this.state.server === scope.server && this.mixer.state.aux === scope.aux ? result : failure;
  }
  saveGroupAndWait(id: number | null, name: string, members: number[], scope: GroupScope, allAuxes: boolean) {
    return this.commitGroupChange(scope, () => this.saveGroup(id, name, members, scope, allAuxes), null);
  }
  deleteGroupsAndWait(ids: number[], scope: GroupScope) {
    return this.commitGroupChange(scope, () => this.deleteGroups(ids, scope), false);
  }
  async resetDeviceData() {
    if (!this.storage.getAllKeys || !this.storage.multiRemove) throw new Error('Device storage cannot be reset.');
    // Close the socket and cancel queued gestures before clearing data. No OSC
    // values are sent, including when a drag was pending when Reset was tapped.
    this.disconnect(false);
    await this.queue;
    const keys = (await this.storage.getAllKeys()).filter(key => key.startsWith('earsmixer.'));
    await this.storage.multiRemove(keys);
    this.compared = '';
    this.patch({ recentStates: {}, restorePrompt: null, selectedTemplate: null, setupComplete: false, server: null, lastServer: null, recent: [], settings: { appearance: 'system', nickname: '', haptics: true },
      preferences: emptyPreferences(), connecting: false, message: '', pinPrompt: null });
  }
  setLifecycle(state: string) {
    if ((state === 'inactive' || state === 'background') && this.state.confirmation) this.dismissConfirmation(this.state.confirmation.id);
    if (state === 'inactive') { this.persistValues(); this.mixer.cancelWrites(); return; }
    if (state === 'background') {
      this.persistValues();
      this.suspended = true;
      this.mixer.disconnect(true);
    } else if (state === 'active') {
      if (this.state.restorePrompt) { this.suspended = false; return; }
      this.compared = '';
      if (this.suspended && this.state.server) {
        this.mixer.identify(this.state.settings.nickname.trim() || null);
        this.mixer.connect(this.state.server, true);
      } else if (this.mixer.state.status === 'connected') this.mixer.refresh();
      this.suspended = false;
    }
  }
  setActive(active: boolean) { this.setLifecycle(active ? 'active' : 'background'); }
}
