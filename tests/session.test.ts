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
  first.disconnect(false);
  const second = make(); await second.hydrate();
  assert.equal(second.state.lastServer, 'http://one.local/');
  await second.connect('one.local');
  assert.equal(second.state.settings.nickname, 'Drummer');
  assert.equal(second.state.settings.appearance, 'dark');
  assert.equal(second.state.preferences.selectedAux, 2);
  assert(requests.every(url => url.endsWith('/api/connection')));
  second.disconnect();
});

test('app switcher retains connection; background and relaunch retain channels with cached display levels and fresh-value drag gating', async () => {
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
  assert.equal(session.mixer.displayValue(1), -10);
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
  assert.equal(restored.mixer.displayValue(1), -10);
  restored.mixer.setParameter('pan');
  assert.equal(restored.mixer.displayValue(1), undefined);
  restored.mixer.setParameter('level');
  assert.equal(restored.mixer.displayValue(1), -10);
  const socket = sockets.at(-1)!;
  socket.onopen?.();
  socket.onmessage?.({ data: JSON.stringify({ config: { channels: [{ channel: 1, label: 'Kick', order: 1 }], aux: [{ channel: 2, label: 'Drums', colour: '#007AFF', stereo: false }], snapshot: 'Live' } }) });
  assert.equal(restored.mixer.beginDrag(1), null);
  socket.onmessage?.({ data: JSON.stringify({ address: '/Input_Channels/1/Aux_Send/2/send_level', args: [-5] }) });
  assert.equal(restored.mixer.displayValue(1), -5);
  assert(restored.mixer.beginDrag(1));
  assert(sent.every(message => !message.address || message.address.endsWith('/?')));
  restored.disconnect();
});

test('device reset removes local profiles and caches without writing desk levels', async () => {
  const data = new Map<string, string>([['unrelated.setting', 'keep'], ['earsmixer.native.channels:http://old.local/', '{}']]);
  const sent: any[] = [];
  const socket: Socket = { readyState: 1, send: raw => sent.push(JSON.parse(raw)), close() {}, onopen: null, onclose: null, onmessage: null, onerror: null };
  const session = new MixerSession({ getItem: async key => data.get(key) || null, setItem: async (key, value) => { data.set(key, value); },
    getAllKeys: async () => [...data.keys()], multiRemove: async keys => { keys.forEach(key => data.delete(key)); } }, () => socket,
    (async (url: string) => Response.json({ url, qr: 'data:image/png;base64,AAA' })) as typeof fetch);
  session.setSettings({ nickname: 'Joe', appearance: 'dark' });
  await session.connect('mixer.local'); socket.onopen?.();
  socket.onmessage?.({ data: JSON.stringify({ config: { channels: [{ channel: 1, label: 'Kick', order: 1 }], aux: [{ channel: 2, label: 'Drums' }] } }) });
  socket.onmessage?.({ data: JSON.stringify({ address: '/Input_Channels/1/Aux_Send/2/send_level', args: [-10] }) });
  session.preferences({ compact: true, channelOrder: [1], favouritesByAux: { '2': { channels: [1], enabled: true } } });
  const drag = session.mixer.beginDrag(1)!;
  session.mixer.drag(drag, 0.8);
  await session.resetDeviceData();
  assert.deepEqual([...data], [['unrelated.setting', 'keep']]);
  assert.equal(session.state.settings.nickname, '');
  assert.equal(session.state.server, null);
  assert.deepEqual(session.state.preferences.favouritesByAux, {});
  assert.equal(session.state.lastServer, null);
  assert(sent.every(message => !message.address || message.address.endsWith('/?')));
});
