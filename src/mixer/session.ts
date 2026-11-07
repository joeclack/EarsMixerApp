import { probeMixer, readSavedMixers, rememberMixer, type SavedMixer } from '../connection';
import { MixerClient, type Socket } from './client';
import { emptyPreferences, readPreferences, type Account, type Preferences, type User } from './model';

type Storage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void> };
export type Settings = { appearance: 'system' | 'light' | 'dark' };
export type Sync = 'guest' | 'saved' | 'saving' | 'pending' | 'conflict' | 'error' | 'unavailable';
type Draft = { userId: string; preferences: Preferences; revision: number };
export type SessionState = {
  hydrated: boolean; server: string | null; recent: SavedMixer[]; settings: Settings;
  user: User | null; preferences: Preferences; revision: number; sync: Sync;
  busy: boolean; connecting: boolean; message: string;
};
export class AccountError extends Error {
  constructor(message: string, public status: number, public data: any) { super(message); }
}
export class MixerSession {
  readonly mixer: MixerClient;
  state: SessionState = {
    hydrated: false, server: null, recent: [], settings: { appearance: 'system' },
    user: null, preferences: emptyPreferences(), revision: 0, sync: 'guest', busy: false, connecting: false, message: '',
  };
  private listeners = new Set<() => void>();
  private generation = 0;
  private connectAttempt = 0;
  private saved = '';
  private guest = emptyPreferences();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private saving: Promise<void> | null = null;
  private storageQueue = Promise.resolve();
  private draft: Draft | null = null;
  private suspended = false;
  constructor(private storage: Storage, factory: (url: string) => Socket, private fetcher: typeof fetch = fetch) {
    this.mixer = new MixerClient(factory);
  }
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  snapshot = () => this.state;
  private patch(update: Partial<SessionState>) { this.state = { ...this.state, ...update }; this.listeners.forEach(fn => fn()); }
  async hydrate() {
    try {
      const [recent, raw] = await Promise.all([this.storage.getItem('earsmixer.connections.v1'), this.storage.getItem('earsmixer.native.settings.v1')]);
      let settings: Partial<Settings> = {};
      try { settings = JSON.parse(raw || '{}'); } catch {}
      this.patch({ recent: readSavedMixers(recent), settings: {
        appearance: ['light', 'dark'].includes(settings.appearance || '') ? settings.appearance as 'light' | 'dark' : 'system',
      } });
    } catch { this.patch({ message: 'Saved settings could not be loaded. You can still connect.' }); }
    this.patch({ hydrated: true });
  }
  private persist(key: string, value: unknown) {
    const serialized = JSON.stringify(value);
    this.storageQueue = this.storageQueue.then(() => this.storage.setItem(key, serialized)).catch(() => {
      this.patch({ message: 'Device storage is unavailable. Keep the app open until your layout is saved to the server.' });
    });
    return this.storageQueue;
  }
  private cache() {
    if (!this.state.server) return;
    return this.persist('earsmixer.native.profile:' + this.state.server, { guest: this.guest, draft: this.draft });
  }
  setSettings(settings: Partial<Settings>) {
    this.patch({ settings: { ...this.state.settings, ...settings } });
    void this.persist('earsmixer.native.settings.v1', this.state.settings);
  }
  async forget(url: string) {
    this.patch({ recent: this.state.recent.filter(item => item.url !== url) });
    await this.persist('earsmixer.connections.v1', this.state.recent);
  }
  async connect(input: string) {
    const attempt = ++this.connectAttempt;
    this.patch({ connecting: true, message: '' });
    try {
      const server = await probeMixer(input, { fetchImpl: this.fetcher });
      if (attempt !== this.connectAttempt) return;
      await this.save();
      if (attempt !== this.connectAttempt) return;
      const generation = ++this.generation;
      if (this.timer) clearTimeout(this.timer);
      this.mixer.disconnect();
      this.saved = ''; this.guest = emptyPreferences(); this.draft = null;
      try {
        const cache = JSON.parse(await this.storage.getItem('earsmixer.native.profile:' + server) || '{}');
        this.guest = readPreferences(cache.guest) || emptyPreferences();
        if (typeof cache.draft?.userId === 'string' && Number.isSafeInteger(cache.draft.revision) && readPreferences(cache.draft.preferences)) this.draft = cache.draft;
      } catch {}
      if (generation !== this.generation || attempt !== this.connectAttempt) return;
      this.patch({ server, recent: rememberMixer(this.state.recent, server), user: null, preferences: this.guest, revision: 0, sync: 'guest', busy: false });
      await this.persist('earsmixer.connections.v1', this.state.recent);
      if (generation !== this.generation || attempt !== this.connectAttempt) return;
      this.mixer.selectAux(this.guest.selectedAux);
      this.mixer.identify(null);
      if (!this.suspended) this.mixer.connect(server);
      await this.refreshAccount();
    } catch (error) {
      if (attempt === this.connectAttempt) { this.patch({ message: error instanceof Error ? error.message : 'Could not connect.' }); throw error; }
    } finally { if (attempt === this.connectAttempt) this.patch({ connecting: false }); }
  }
  disconnect() {
    ++this.connectAttempt; ++this.generation;
    if (this.timer) clearTimeout(this.timer);
    this.mixer.disconnect();
    this.patch({ server: null, user: null, sync: 'guest', busy: false, connecting: false, message: '', preferences: emptyPreferences(), revision: 0 });
  }
  async request(path = '', options: { method?: string; body?: unknown } = {}): Promise<any> {
    const server = this.state.server;
    if (!server) throw new Error('Connect to your mixer first.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await this.fetcher(server + 'api/account' + path, {
        method: options.method || 'GET', credentials: 'include', cache: 'no-store', signal: controller.signal,
        ...(options.body !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(options.body) } : {}),
      });
      let data: any;
      try { data = await response.json(); } catch { throw new Error('Accounts require EarsMixer server 1.4.0 or newer.'); }
      if (!response.ok) throw new AccountError(data.error || 'The account request failed.', response.status, data);
      return data;
    } finally { clearTimeout(timeout); }
  }
  private applyAccount(data: Account) {
    if (!data.user) return;
    const saved = readPreferences(data.preferences);
    let preferences = saved || this.guest;
    let revision = data.revision, sync: Sync = saved ? 'saved' : 'pending';
    this.saved = saved ? JSON.stringify(saved) : '';
    if (this.draft?.userId === data.user.id) {
      preferences = this.draft.preferences;
      sync = this.draft.revision === data.revision ? 'pending' : 'conflict';
      revision = data.revision;
    }
    this.patch({ user: data.user, revision, preferences, sync, message: '' });
    this.mixer.identify(data.user.displayName); this.mixer.selectAux(preferences.selectedAux);
    if (sync === 'pending' && this.draft) this.scheduleSave();
  }
  async refreshAccount() {
    if (!this.state.server || this.state.busy || this.saving) return;
    const generation = this.generation;
    try {
      const data: Account = await this.request();
      if (generation !== this.generation || this.state.busy || this.saving) return;
      if (!data.user) {
        if (this.state.user) this.expired();
        return;
      }
      if (this.state.user && data.user.id !== this.state.user.id) {
        this.mixer.cancelWrites(); this.patch({ user: null, preferences: this.guest, sync: 'guest' });
      }
      if (this.state.user && data.revision !== this.state.revision && JSON.stringify(this.state.preferences) !== this.saved) {
        this.patch({ revision: data.revision, sync: 'conflict' }); return;
      }
      if (!this.state.user || data.revision !== this.state.revision) this.applyAccount(data);
      else { this.patch({ user: data.user }); this.mixer.identify(data.user.displayName); }
    } catch (error) {
      if (generation === this.generation) this.patch({ sync: this.state.user ? 'error' : 'unavailable', message: error instanceof Error ? error.message : 'Accounts are unavailable.' });
    }
  }
  async authenticate(username: string, password: string, register: boolean, displayName?: string) {
    if (this.state.busy || this.saving) return;
    const generation = ++this.generation;
    this.patch({ busy: true, message: '' });
    try {
      const data = await this.request(register ? '/register' : '/login', { method: 'POST', body: { username, password, ...(register ? { displayName: displayName?.trim() || username } : {}) } });
      if (generation !== this.generation) return;
      this.mixer.cancelWrites(); this.applyAccount(data);
      if (register) await this.save(true);
    } finally { if (generation === this.generation) this.patch({ busy: false }); }
  }
  async rename(displayName: string) {
    if (!this.state.user || this.state.busy) return;
    const generation = this.generation;
    this.patch({ busy: true, message: '' });
    try {
      const data = await this.request('', { method: 'PUT', body: { userId: this.state.user.id, displayName } });
      if (generation === this.generation) { this.patch({ user: data.user, message: 'Name saved.' }); this.mixer.identify(data.user.displayName); }
    } finally { if (generation === this.generation) this.patch({ busy: false }); }
  }
  preferences(update: Partial<Preferences>) {
    const preferences = { ...this.state.preferences, ...update };
    if (!readPreferences(preferences)) return;
    this.patch({ preferences });
    if ('selectedAux' in update) this.mixer.selectAux(preferences.selectedAux);
    if (this.state.user) {
      this.draft = { userId: this.state.user.id, preferences, revision: this.state.revision };
      if (this.state.sync !== 'conflict') this.patch({ sync: 'pending' });
      this.scheduleSave();
    } else this.guest = preferences;
    void this.cache();
  }
  private scheduleSave() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { void this.save(); }, 650);
  }
  save(force = false): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    if (this.saving) return this.saving;
    if (!this.state.user || !this.state.server || (this.state.sync === 'conflict' && !force) ||
      (!force && JSON.stringify(this.state.preferences) === this.saved)) return Promise.resolve();
    const generation = this.generation;
    const preferences = this.state.preferences, json = JSON.stringify(preferences);
    const body = { userId: this.state.user.id, preferences, revision: this.state.revision };
    this.patch({ sync: 'saving' });
    this.saving = (async () => {
      try {
        const data: Account = await this.request('/preferences', { method: 'PUT', body });
        if (generation !== this.generation) return;
        this.saved = json;
        const dirty = JSON.stringify(this.state.preferences) !== json;
        this.draft = dirty ? { userId: body.userId, preferences: this.state.preferences, revision: data.revision } : null;
        this.patch({ revision: data.revision, sync: dirty ? 'pending' : 'saved', message: '' });
        await this.cache();
      } catch (error) {
        if (generation !== this.generation) return;
        this.draft = { userId: body.userId, preferences: this.state.preferences, revision: body.revision };
        if (error instanceof AccountError && error.status === 409) this.patch({ revision: error.data.revision, sync: 'conflict' });
        else if (error instanceof AccountError && error.status === 401) this.expired();
        else this.patch({ sync: 'error', message: 'Layout is saved on this device. Reconnect and retry to save it to your account.' });
        await this.cache();
      } finally {
        this.saving = null;
        if (generation === this.generation && this.state.sync === 'pending') this.scheduleSave();
      }
    })();
    return this.saving;
  }
  async loadSaved() {
    if (this.state.busy || this.saving) return;
    const generation = this.generation;
    this.patch({ busy: true });
    try {
      const data = await this.request();
      if (generation !== this.generation) return;
      if (!data.user || data.user.id !== this.state.user?.id) { this.expired(); return; }
      this.draft = null; this.applyAccount(data); await this.cache();
    } finally { if (generation === this.generation) this.patch({ busy: false }); }
  }
  private expired() {
    if (this.timer) clearTimeout(this.timer);
    this.mixer.cancelWrites(); this.mixer.identify(null); this.mixer.selectAux(this.guest.selectedAux);
    this.patch({ user: null, preferences: this.guest, revision: 0, sync: 'guest', message: 'Your session ended. Sign in again to restore your layout.' });
  }
  async logout() {
    await this.save();
    if (['pending', 'error', 'conflict'].includes(this.state.sync)) throw new Error('Save your changes or load the saved layout before signing out.');
    if (this.state.busy) return;
    const generation = this.generation;
    this.patch({ busy: true });
    try {
      await this.request('/logout', { method: 'POST', body: {} });
      if (generation !== this.generation) return;
      this.draft = null; this.saved = ''; ++this.generation;
      this.expired(); this.patch({ message: 'Signed out. Guest settings are restored.', busy: false }); await this.cache();
    } finally { if (generation === this.generation) this.patch({ busy: false }); }
  }
  setActive(active: boolean) {
    this.suspended = !active;
    if (!active) { this.mixer.disconnect(); void this.save(); }
    else if (this.state.server) {
      this.mixer.selectAux(this.state.preferences.selectedAux); this.mixer.connect(this.state.server);
      void this.refreshAccount().then(() => this.save());
    }
  }
}
