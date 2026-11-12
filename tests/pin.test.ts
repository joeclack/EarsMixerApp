import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MixerSession } from '../src/mixer/session';
import type { Socket } from '../src/mixer/client';

const config = JSON.stringify({ config: { channels: [{ channel: 1, label: 'Kick' }], aux: [{ channel: 1, label: 'Drums IEM' }], snapshot: '' } });

test('a mixer that requires a PIN prompts once, then recognises the device until access is revoked', async () => {
  const data = new Map<string, string>();
  const sockets: (Socket & { sent: any[] })[] = [];
  const pairs: any[] = [];
  let pin = '482913';
  const fetcher = (async (url: string, init?: RequestInit) => {
    if (url.endsWith('/api/pair')) {
      const body = JSON.parse(String(init?.body)); pairs.push(body);
      return body.pin === pin ? Response.json({ paired: true, token: 'a'.repeat(64) })
        : Response.json({ error: 'Incorrect PIN. Check it with the person running the mixer.' }, { status: 401 });
    }
    return Response.json({ url, qr: 'data:image/png;base64,AAA' });
  }) as typeof fetch;
  const make = () => new MixerSession({ getItem: async key => data.get(key) ?? null, setItem: async (key, value) => { data.set(key, value); } },
    () => { const socket = { readyState: 1, sent: [] as any[], send(value: string) { this.sent.push(JSON.parse(value)); }, close() {},
      onopen: null, onclose: null, onmessage: null, onerror: null } as Socket & { sent: any[] }; sockets.push(socket); return socket; }, fetcher);
  const open = () => { const socket = sockets.at(-1)!; socket.onopen?.(); return socket; };

  const session = make(); await session.hydrate();
  session.setSettings({ nickname: 'Joe' });
  await session.connect('mixer.local');
  let socket = open();
  // The device identifies itself first, with no token yet.
  const first = socket.sent[0].auth;
  assert.match(first.device, /^[a-f0-9]{32}$/); assert.equal(first.token, null); assert.equal(first.name, 'Joe');

  // The server asks for the PIN: the app stops reconnecting and prompts.
  socket.onmessage?.({ data: JSON.stringify({ auth: 'required' }) });
  assert.deepEqual(session.state.pinPrompt, { revoked: false });
  assert.equal(session.mixer.state.status, 'disconnected');
  const before = sockets.length;

  await assert.rejects(session.pair('000000'), /Incorrect PIN/);
  assert.deepEqual(session.state.pinPrompt, { revoked: false });
  assert.equal(sockets.length, before, 'a wrong PIN does not reconnect');

  // The right PIN stores the token and reconnects with it.
  await session.pair(pin);
  assert.equal(session.state.pinPrompt, null);
  assert.deepEqual(pairs.at(-1), { pin, device: first.device, name: 'Joe' });
  socket = open();
  assert.deepEqual(socket.sent[0].auth, { device: first.device, token: 'a'.repeat(64), name: 'Joe' });
  socket.onmessage?.({ data: config });
  assert.equal(session.mixer.state.status, 'connected');
  session.disconnect(false);

  // A later launch reuses the same device ID and token without prompting.
  const later = make(); await later.hydrate();
  await later.connect('mixer.local');
  socket = open();
  assert.deepEqual(socket.sent[0].auth, { device: first.device, token: 'a'.repeat(64), name: 'Joe' });
  assert.equal(later.state.pinPrompt, null);

  // Signed out by the admin: the token is forgotten and the PIN is asked for again.
  socket.onmessage?.({ data: JSON.stringify({ auth: 'revoked' }) });
  assert.deepEqual(later.state.pinPrompt, { revoked: true });
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(data.get('earsmixer.native.access:http://mixer.local/'), 'null');
  // Choosing another mixer clears the prompt.
  later.disconnect();
  assert.equal(later.state.pinPrompt, null);
});
