import test from 'node:test';
import assert from 'node:assert/strict';
import { MixerSession } from '../src/mixer/session';
import type { Socket } from '../src/mixer/client';
import { readLevelStates, stateKey } from '../src/mixer/recentStates';

const config = { channels: [{ channel: 1, label: 'Kick', order: 1 }, { channel: 2, label: 'Snare', order: 2 }], aux: [{ channel: 1, label: 'Drums' }, { channel: 2, label: 'Vocals' }] };
function fixture(data = new Map<string, string>()) {
  const sent: any[] = [];
  const socket: Socket = { readyState: 1, onopen: null, onmessage: null, onerror: null, onclose: null, close() {}, send(raw) { sent.push(JSON.parse(raw)); } };
  const session = new MixerSession({ getItem: async key => data.get(key) || null, setItem: async (key, value) => { data.set(key, value); } }, () => socket,
    (async (url: string) => Response.json({ url, qr: 'data:image/png;base64,AAA' })) as typeof fetch);
  const levels = (aux: number, a: number, b: number) => [a, b].forEach((value, i) => socket.onmessage?.({ data: JSON.stringify({ address: `/Input_Channels/${i + 1}/Aux_Send/${aux}/send_level`, args: [value] }) }));
  const open = () => { socket.onopen?.(); socket.onmessage?.({ data: JSON.stringify({ config }) }); };
  return { session, sent, socket, levels, open, data };
}

test('AUX states survive relaunch, compare fresh levels, restore all saved channels and isolate mixers', async () => {
  const f = fixture(), key = stateKey('http://desk.local/', 1);
  try {
    await f.session.connect('desk.local'); f.open();
    f.levels(1, -10, -20);
    assert.equal(f.session.state.restorePrompt, null);
    assert.deepEqual(f.session.state.recentStates[key].levels, { 1: -10, 2: -20 });
    f.session.preferences({ selectedAux: 2 }); f.levels(2, -30, -40);
    f.session.preferences({ selectedAux: 1 });
    f.levels(1, -5, -6);
    const prompt = f.session.state.restorePrompt!;
    assert(prompt);
    assert.deepEqual(prompt.saved.levels, { 1: -10, 2: -20 });
    f.session.setChannelHidden(2, true);
    f.session.resolveLevelRestore(prompt, true);
    const writes = f.sent.filter(m => m.address && !m.address.endsWith('/?'));
    assert.deepEqual(writes.map(m => m.args[0]), [-10, -20]);
    assert(writes.every(m => m.address.includes('/Aux_Send/1/send_level')));
    assert.deepEqual(f.session.mixer.liveLevels, { 1: -10, 2: -20 });
    f.session.disconnect(false);
    await f.session.connect('desk.local'); f.open(); f.levels(1, -1, -2);
    assert(f.session.state.restorePrompt);
    const oldPrompt = f.session.state.restorePrompt!;
    f.session.preferences({ selectedAux: 2 }); f.levels(2, -30, -40);
    const before = f.sent.length;
    f.session.resolveLevelRestore(oldPrompt, true);
    assert.equal(f.sent.length, before); // Old confirmation cannot write to a different AUX.
    assert.equal(f.session.state.restorePrompt, null);
    await f.session.connect('other.local'); f.open(); f.levels(1, -7, -8);
    assert.equal(f.session.state.restorePrompt, null);
    assert.deepEqual(f.session.state.recentStates[key].levels, { 1: -10, 2: -20 });
    f.session.disconnect(false);
    // The next instance reads independent snapshots rather than the current live-value cache.
    const next = fixture(f.data);
    try {
      await next.session.connect('desk.local'); next.open(); next.session.preferences({ selectedAux: 1 }); next.levels(1, -50, -60);
      assert.equal(next.session.state.restorePrompt?.saved.name, 'Drums');
      assert(next.session.state.restorePrompt!.saved.editedAt > 0);
      const before = next.sent.length;
      next.session.resolveLevelRestore(next.session.state.restorePrompt!, false);
      assert.equal(next.sent.length, before);
      assert.deepEqual(next.session.state.recentStates[key].levels, { 1: -10, 2: -20 });
      const token = next.session.mixer.beginDrag(1)!;
      next.session.mixer.drag(token, 0); next.session.mixer.flush(token);
      assert.equal(next.session.state.recentStates[key].levels[1], -150);
    } finally { next.session.disconnect(); }
  } finally { f.session.disconnect(); }
});

test('comparison works in pan mode without changing pan, and stale confirmations cannot restore after reconnect', async () => {
  const f = fixture();
  try {
    await f.session.connect('desk.local'); f.open(); f.levels(1, -10, -20);
    f.session.mixer.setParameter('pan');
    f.socket.onmessage?.({ data: JSON.stringify({ address: '/Input_Channels/1/Aux_Send/1/send_pan', args: [0.8] }) });
    f.levels(1, -1, -2);
    assert.equal(f.session.state.restorePrompt, null); // Mode switch alone does not prompt again.
    f.session.setLifecycle('background'); f.session.setLifecycle('active'); f.open();
    f.levels(1, -1, -2);
    const prompt = f.session.state.restorePrompt!;
    assert(prompt);
    const before = f.sent.length;
    f.session.resolveLevelRestore(prompt, true);
    assert(f.sent.slice(before).every(m => m.address?.endsWith('/send_level')));
    f.session.setLifecycle('background');
    f.session.resolveLevelRestore(prompt, true);
    assert.equal(f.session.state.restorePrompt, null);
  } finally { f.session.disconnect(); }
});

test('invalid stored levels are rejected', () => {
  const raw = JSON.stringify({ x: { server: 'http://desk.local/', aux: 1, name: 'Drums', editedAt: 123, levels: { 1: -20, 2: 99, 3: 'bad' } } });
  assert.deepEqual(readLevelStates(raw)['http://desk.local/#1'].levels, { 1: -20 });
});
