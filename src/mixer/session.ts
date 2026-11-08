import { probeMixer, readSavedMixers, rememberMixer, type SavedMixer } from '../connection';
import { MixerClient, type Socket } from './client';
import { emptyPreferences, readPreferences, type Preferences } from './model';
type Storage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void> };
export type Settings = { appearance: 'system' | 'light' | 'dark'; nickname: string };
export type SessionState = {
  hydrated: boolean; server: string | null; recent: SavedMixer[]; settings: Settings;
  preferences: Preferences; connecting: boolean; message: string;
};
export class MixerSession {
  readonly mixer: MixerClient;
  state: SessionState = { hydrated: false, server: null, recent: [], settings: { appearance: 'system', nickname: '' },
    preferences: emptyPreferences(), connecting: false, message: '' };
  private listeners = new Set<() => void>();
  private attempt = 0;
  private suspended = false;
  private queue = Promise.resolve();
  constructor(private storage: Storage, factory: (url: string) => Socket, private fetcher: typeof fetch = fetch) { this.mixer = new MixerClient(factory); }
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  snapshot = () => this.state;
  private patch(update: Partial<SessionState>) { this.state = { ...this.state, ...update }; this.listeners.forEach(fn => fn()); }
  async hydrate() {
    try {
      const [recent, raw] = await Promise.all([this.storage.getItem('earsmixer.connections.v1'), this.storage.getItem('earsmixer.native.settings.v1')]);
      let settings: Partial<Settings> = {};
      try { settings = JSON.parse(raw || '{}') || {}; } catch {}
      this.patch({ recent: readSavedMixers(recent), settings: {
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
      await this.queue;
      let raw: any = {};
      try { raw = JSON.parse(await this.storage.getItem('earsmixer.native.profile:' + server) || '{}') || {}; } catch {}
      if (attempt !== this.attempt) return;
      // Keep existing local guest layouts when upgrading. Never import account credentials.
      const preferences = readPreferences(raw.preferences) || readPreferences(raw.guest) || emptyPreferences();
      this.mixer.disconnect();
      this.patch({ server, preferences, recent: rememberMixer(this.state.recent, server) });
      this.mixer.selectAux(preferences.selectedAux);
      this.mixer.identify(this.state.settings.nickname.trim() || null);
      if (!this.suspended) this.mixer.connect(server);
      await this.persist('earsmixer.connections.v1', this.state.recent);
    } catch (error) {
      if (attempt === this.attempt) { this.patch({ message: error instanceof Error ? error.message : 'Could not connect.' }); throw error; }
    } finally { if (attempt === this.attempt) this.patch({ connecting: false }); }
  }
  disconnect() {
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
  setActive(active: boolean) {
    this.suspended = !active;
    if (!active) this.mixer.disconnect();
    else if (this.state.server) {
      this.mixer.selectAux(this.state.preferences.selectedAux);
      this.mixer.identify(this.state.settings.nickname.trim() || null);
      this.mixer.connect(this.state.server);
    }
  }
}
