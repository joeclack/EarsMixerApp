import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MixerSession } from '../src/mixer/session';
import type { Socket } from '../src/mixer/client';

test('nickname, appearance and per-server layouts automatically persist without account requests', async () => {
  const data = new Map<string, string>();
  const requests: string[] = [];
  const make = () => new MixerSession({ getItem: async key => data.get(key) || null, setItem: async (key, value) => { data.set(key, value); } },
    () => ({ readyState: 1, send() {}, close() {}, onopen: null, onclose: null, onmessage: null, onerror: null }) as Socket,
    (async (url: string) => { requests.push(url); return Response.json({ url, qr: 'data:image/png;base64,AAA' }); }) as typeof fetch);
  const first = make(); await first.hydrate();
  first.setSettings({ nickname: 'Drummer', appearance: 'dark' });
  await first.connect('one.local');
  first.preferences({ channelOrder: [3, 1, 2], selectedAux: 2, compact: true });
  await first.connect('two.local');
  assert.equal(first.state.preferences.compact, false);
  await first.connect('one.local');
  assert.deepEqual(first.state.preferences.channelOrder, [3, 1, 2]);
  first.disconnect();
  const second = make(); await second.hydrate(); await second.connect('one.local');
  assert.equal(second.state.settings.nickname, 'Drummer');
  assert.equal(second.state.settings.appearance, 'dark');
  assert.equal(second.state.preferences.selectedAux, 2);
  assert(requests.every(url => url.endsWith('/api/connection')));
  second.disconnect();
});

test('app switcher retains connection; background and relaunch retain channels without recalling levels', async () => {
  const data = new Map<string, string>();
  const sockets: Socket[] = [];
  const sent: any[] = [];
  const make = () => new MixerSession({ getItem: async key => data.get(key) || null, setItem: async (key, value) => { data.set(key, value); } },
    () => { const socket: Socket = { readyState: 1, send: raw => sent.push(JSON.parse(raw)), close() {}, onopen: null, onclose: null, onmessage: null, onerror: null }; sockets.push(socket); return socket; },
    (async (url: string) => Response.json({ url, qr: 'data:image/png;base64,AAA' })) as typeof fetch);
  const session = make(); await session.connect('mixer.local');
  sockets[0].onopen?.();
  sockets[0].onmessage?.({ data: JSON.stringify({ config: { channels: [{ channel: 1, label: 'Kick', order: 1 }], aux: [{ channel: 2, label: 'Drums', colour: '#007AFF', stereo: false }], snapshot: 'Live' } }) });
  sockets[0].onmessage?.({ data: JSON.stringify({ address: '/Input_Channels/1/Aux_Send/2/send_level', args: [-10] }) });
  session.setLifecycle('inactive');
  assert.equal(session.mixer.state.status, 'connected');
  assert.equal(sockets.length, 1);
  session.setLifecycle('background');
  assert.equal(session.mixer.state.config?.channels[0].label, 'Kick');
  assert.deepEqual(session.mixer.state.values, {});
  assert.equal(session.mixer.beginDrag(1), null);
  session.setLifecycle('active');
  assert.equal(sockets.length, 2);
  assert.equal(session.mixer.state.config?.aux[0].label, 'Drums');
  session.disconnect();
  await new Promise(resolve => setTimeout(resolve, 0));
  const restored = make(); await restored.connect('mixer.local');
  assert.equal(restored.mixer.state.config?.channels[0].label, 'Kick');
  assert.equal(restored.mixer.beginDrag(1), null);
  assert.deepEqual(restored.mixer.state.values, {});
  assert(sent.every(message => !message.address || message.address.endsWith('/?')));
  restored.disconnect();
});
