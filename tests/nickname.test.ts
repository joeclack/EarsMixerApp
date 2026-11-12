import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MixerSession } from '../src/mixer/session';
import type { Socket } from '../src/mixer/client';

test('the nickname is required: a cleared field is never used or saved and is restored afterwards', async () => {
  const data = new Map<string, string>();
  const storage = { getItem: async (key: string) => data.get(key) ?? null, setItem: async (key: string, value: string) => { data.set(key, value); } };
  const socket = () => ({ readyState: 1, send() {}, close() {}, onopen: null, onclose: null, onmessage: null, onerror: null }) as Socket;
  const first = new MixerSession(storage, socket);
  await first.hydrate();
  assert.equal(first.hasNickname(), false);
  first.setSettings({ nickname: 'Joe' });
  assert.equal(first.hasNickname(), true);
  first.setSettings({ nickname: '   ' });
  assert.equal(first.state.settings.nickname, '   ');
  assert.equal(first.nickname(), 'Joe');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(JSON.parse(data.get('earsmixer.native.settings.v1')!).nickname, 'Joe');
  assert.equal(first.restoreNickname(), 'Joe');
  assert.equal(first.state.settings.nickname, 'Joe');
  const second = new MixerSession(storage, socket);
  await second.hydrate();
  assert.equal(second.nickname(), 'Joe');
});
