import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { MixerSession, AccountError } from '../src/mixer/session';
import { emptyPreferences, type Account } from '../src/mixer/model';
import type { Socket } from '../src/mixer/client';

function setup(t: any) {
  const storage = new Map<string, string>();
  let signedIn = false;
  let profile: Account = { user: { id: 'alice-id', username: 'alice', displayName: 'Alice' }, preferences: null, revision: 0 };
  const writes: any[] = [], audio: any[] = [];
  const fetcher = (async (url: string, options: RequestInit = {}) => {
    const pathname = new URL(url).pathname;
    const body = options.body ? JSON.parse(String(options.body)) : {};
    if (pathname === '/api/connection') return Response.json({ url: 'http://mixer.local/', qr: 'data:image/png;base64,AAA' });
    if (pathname.endsWith('/login') || pathname.endsWith('/register')) { signedIn = true; return Response.json(profile); }
    if (pathname.endsWith('/logout')) { signedIn = false; return Response.json({ ok: true }); }
    if (pathname.endsWith('/preferences')) {
      writes.push(body);
      if (!signedIn || body.userId !== profile.user?.id) return Response.json({ error: 'Sign in again' }, { status: 401 });
      if (body.revision !== profile.revision) return Response.json({ ...profile, error: 'Conflict' }, { status: 409 });
      profile = { ...profile, preferences: body.preferences, revision: profile.revision + 1 };
    }
    return Response.json(signedIn ? profile : { user: null, preferences: null, revision: 0 });
  }) as typeof fetch;
  const session = new MixerSession({
    getItem: async key => storage.get(key) || null, setItem: async (key, value) => { storage.set(key, value); },
  }, () => ({ readyState: 1, send: raw => audio.push(JSON.parse(raw)), close() {}, onopen: null, onclose: null, onmessage: null, onerror: null } as Socket), fetcher);
  t.after(() => session.disconnect());
  return { session, storage, writes, audio, remote: (changes: Partial<Account>) => { profile = { ...profile, ...changes }; }, expire: () => { signedIn = false; } };
}
test('registration imports the guest layout; account saves cannot contain audio values', async t => {
  const { session, writes, audio } = setup(t);
  await session.hydrate(); await session.connect('mixer.local');
  session.preferences({ selectedAux: 2, compact: true, channelOrder: [2, 1] });
  await session.authenticate('alice', 'password123', true);
  assert.equal(session.state.sync, 'saved'); assert.equal(writes[0].userId, 'alice-id');
  assert.equal(writes[0].preferences.selectedAux, 2);
  assert.equal('levels' in writes[0].preferences, false);
  assert.equal(audio.filter(m => m.address && !m.address.endsWith('/?')).length, 0);
});
test('another device cannot silently overwrite the layout; both conflict choices work', async t => {
  const { session, remote } = setup(t);
  await session.connect('mixer.local'); await session.authenticate('alice', 'password123', true);
  remote({ revision: 2, preferences: { ...emptyPreferences(), selectedAux: 7 } });
  session.preferences({ selectedAux: 3 }); await session.save();
  assert.equal(session.state.sync, 'conflict'); assert.equal(session.state.preferences.selectedAux, 3);
  await session.loadSaved(); assert.equal(session.state.preferences.selectedAux, 7);
  remote({ revision: 3, preferences: { ...emptyPreferences(), selectedAux: 8 } });
  session.preferences({ selectedAux: 4 }); await session.save();
  assert.equal(session.state.sync, 'conflict');
  await session.save(true); assert.equal(session.state.sync, 'saved');
  assert.equal(session.state.preferences.selectedAux, 4);
});
test('sign-out restores guest settings and session expiration exposes sign-in', async t => {
  const { session, expire } = setup(t);
  await session.connect('mixer.local'); session.preferences({ compact: true });
  await session.authenticate('alice', 'password123', true);
  session.preferences({ compact: false }); await session.save();
  await session.logout();
  assert.equal(session.state.user, null); assert.equal(session.state.preferences.compact, true);
  await session.authenticate('alice', 'password123', false);
  expire(); await session.refreshAccount();
  assert.equal(session.state.user, null); assert.match(session.state.message, /session ended/i);
});
test('device settings persist without storing account passwords', async t => {
  const { session, storage } = setup(t);
  await session.hydrate(); session.setSettings({ appearance: 'dark', haptics: false });
  await session.connect('mixer.local'); await session.authenticate('alice', 'very-private-password', true);
  await delay(10);
  assert.equal(JSON.parse(storage.get('earsmixer.native.settings.v1')!).appearance, 'dark');
  assert.ok(!JSON.stringify([...storage]).includes('very-private-password'));
});
test('local guest profiles remain isolated between mixer servers', async t => {
  const { session } = setup(t);
  await session.connect('one.local'); session.preferences({ selectedAux: 4, compact: true });
  await session.connect('two.local'); assert.equal(session.state.preferences.compact, false);
  session.preferences({ selectedAux: 8 });
  await session.connect('one.local'); assert.equal(session.state.preferences.selectedAux, 4);
  assert.equal(session.state.preferences.compact, true);
});
