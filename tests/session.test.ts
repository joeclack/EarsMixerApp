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
