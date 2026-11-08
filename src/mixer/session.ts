import { normalizeMixerAddress, probeMixer, readSavedMixers, rememberMixer, type SavedMixer } from '../connection';
import { MixerClient, type Socket } from './client';
import { emptyPreferences, readPreferences, type Preferences, parseConfig } from './model';
type Storage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; getAllKeys?(): Promise<readonly string[]>; multiRemove?(keys: string[]): Promise<void> };
export type Settings = { appearance: 'system' | 'light' | 'dark'; nickname: string };
export type SessionState = {
  hydrated: boolean; lastServer: string | null; server: string | null; recent: SavedMixer[]; settings: Settings;
  preferences: Preferences; connecting: boolean; message: string;
};
export class MixerSession {
  readonly mixer: MixerClient;
  state: SessionState = { hydrated: false, lastServer: null, server: null, recent: [], settings: { appearance: 'system', nickname: '' },
    preferences: emptyPreferences(), connecting: false, message: '' };
  private listeners = new Set<() => void>();
  private attempt = 0;
  private suspended = false;
  private queue = Promise.resolve();
  private valueTimer: ReturnType<typeof setTimeout> | null = null;
  private persistValues() {
    if (this.valueTimer) clearTimeout(this.valueTimer);
    this.valueTimer = null;
    if (this.state.server) void this.persist("earsmixer.native.values:" + this.state.server, this.mixer.getValueCache());
  }
  constructor(private storage: Storage, factory: (url: string) => Socket, private fetcher: typeof fetch = fetch) {
    this.mixer = new MixerClient(factory);
    let previous: unknown = null;
    let revision = 0;
    this.mixer.subscribe(() => {
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
      const [recent, raw, last] = await Promise.all([this.storage.getItem('earsmixer.connections.v1'), this.storage.getItem('earsmixer.native.settings.v1'), this.storage.getItem('earsmixer.native.last-server.v1')]);
      let settings: Partial<Settings> = {};
      try { settings = JSON.parse(raw || '{}') || {}; } catch {}
      let lastServer: string | null = null;
      try { const saved = JSON.parse(last || 'null'); if (typeof saved === 'string') lastServer = normalizeMixerAddress(saved); } catch {}
      this.patch({ lastServer, recent: readSavedMixers(recent), settings: {
        appearance: settings.appearance === 'dark' || settings.appearance === 'light' ? settings.appearance : 'system',
        nickname: typeof settings.nickname === 'string' ? settings.nickname.slice(0, 80) : '',
      } });
    } catch { this.patch({ message: 'Could not load device settings.' }); }
    this.patch({ hydrated: true });
  }
  private persist(key: string, value: unknown) {
    const json = JSON.stringify(value);
    this.queue = this.queue.then(() => this.storage.setItem(key, json)).catch(() => this.patch({ message: 'Could not save to this device.' }));
    return this.queue;
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
  async connect(input: string) {
    const attempt = ++this.attempt;
    this.patch({ connecting: true, message: '' });
    try {
      const server = await probeMixer(input, { fetchImpl: this.fetcher });
      this.persistValues();
      await this.queue;
      let raw: any = {};
      try { raw = JSON.parse(await this.storage.getItem('earsmixer.native.profile:' + server) || '{}') || {}; } catch {}
      let channels = null;
      try { channels = parseConfig(JSON.parse(await this.storage.getItem('earsmixer.native.channels:' + server) || 'null')); } catch {}
      let values: unknown = {};
      try { values = JSON.parse(await this.storage.getItem("earsmixer.native.values:" + server) || "{}"); } catch {}
      if (attempt !== this.attempt) return;
      // Keep existing local guest layouts when upgrading. Never import account credentials.
      const preferences = readPreferences(raw.preferences) || readPreferences(raw.guest) || emptyPreferences();
      this.mixer.disconnect();
      this.patch({ server, preferences, recent: rememberMixer(this.state.recent, server) });
      this.mixer.restoreValues(values);
      if (channels) this.mixer.restoreConfig(channels, preferences.selectedAux);
      this.mixer.selectAux(preferences.selectedAux);
      this.mixer.identify(this.state.settings.nickname.trim() || null);
      if (!this.suspended) this.mixer.connect(server, true);
      await this.persist('earsmixer.connections.v1', this.state.recent);
      if (attempt === this.attempt) {
        this.patch({ lastServer: server });
        await this.persist('earsmixer.native.last-server.v1', server);
      }
    } catch (error) {
      if (attempt === this.attempt) { this.patch({ message: error instanceof Error ? error.message : 'Could not connect.' }); throw error; }
    } finally { if (attempt === this.attempt) this.patch({ connecting: false }); }
  }
  disconnect(forgetConnection = true) {
    this.persistValues();
    if (forgetConnection) { this.patch({ lastServer: null }); void this.persist('earsmixer.native.last-server.v1', null); }
    ++this.attempt; this.mixer.disconnect();
    this.patch({ server: null, connecting: false, preferences: emptyPreferences(), message: '' });
  }
  preferences(update: Partial<Preferences>) {
    const preferences = readPreferences({ ...this.state.preferences, ...update });
    if (!preferences) return;
    this.patch({ preferences });
    if ('selectedAux' in update) this.mixer.selectAux(preferences.selectedAux);
    if (this.state.server) void this.persist('earsmixer.native.profile:' + this.state.server, { preferences });
  }
  async resetDeviceData() {
    if (!this.storage.getAllKeys || !this.storage.multiRemove) throw new Error('Device storage cannot be reset.');
    // Close the socket and cancel queued gestures before clearing data. No OSC
    // values are sent, including when a drag was pending when Reset was tapped.
    this.disconnect(false);
    await this.queue;
    const keys = (await this.storage.getAllKeys()).filter(key => key.startsWith('earsmixer.'));
    await this.storage.multiRemove(keys);
    this.patch({ server: null, lastServer: null, recent: [], settings: { appearance: 'system', nickname: '' },
      preferences: emptyPreferences(), connecting: false, message: '' });
  }
  setLifecycle(state: string) {
    if (state === 'inactive') { this.persistValues(); this.mixer.cancelWrites(); return; }
    if (state === 'background') {
      this.persistValues();
      this.suspended = true;
      this.mixer.disconnect(true);
    } else if (state === 'active') {
      if (this.suspended && this.state.server) {
        this.mixer.identify(this.state.settings.nickname.trim() || null);
        this.mixer.connect(this.state.server, true);
      } else if (this.mixer.state.status === 'connected') this.mixer.refresh();
      this.suspended = false;
    }
  }
  setActive(active: boolean) { this.setLifecycle(active ? 'active' : 'background'); }
}
