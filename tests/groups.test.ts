import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { MixerClient, type Socket } from '../src/mixer/client';
import { MixerSession } from '../src/mixer/session';
import { dbToPosition, emptyPreferences, readPreferences, parseConfig } from '../src/mixer/model';
import { mixerRows } from '../src/mixer/groups';

const config = { channels: [{ channel: 1, label: 'Guitar L' }, { channel: 2, label: 'Guitar R' }, { channel: 3, label: 'Vocal' }],
  aux: [{ channel: 1, label: 'Drums' }, { channel: 2, label: 'Vocals' }] };
const address = (id: number, aux = 1) => `/Input_Channels/${id}/Aux_Send/${aux}/send_level`;
function setup(t: any) {
  const messages: any[] = [];
  const socket: Socket = { readyState: 1, send: raw => messages.push(JSON.parse(raw)), close() {}, onopen: null, onclose: null, onerror: null, onmessage: null };
  const client = new MixerClient(() => socket);
  client.configureGroups({ '1': [[1, 2]] });
  client.connect('http://mixer/'); socket.onopen?.();
  const receive = (value: unknown) => socket.onmessage?.({ data: JSON.stringify(value) });
  receive({ config });
  const level = (id: number, value: number, aux = 1) => receive({ address: address(id, aux), args: [value] });
  const writes = () => messages.filter(m => m.address && !m.address.endsWith('/?'));
  const move = (db: number) => { const token = client.beginDrag(-1); assert(token); client.drag(token, dbToPosition(db)); client.flush(token); client.cancelDrag(token); };
  t.after(() => client.disconnect());
  return { client, level, writes, move, receive, socket };
}
const near = (actual: number, expected: number) => assert(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);

test('group drag preserves dB offsets, reaches all-off, restores balance and follows individual desk edits', t => {
  const { client, level, move, writes } = setup(t);
  level(1, 0); level(2, -5);
  assert.equal(writes().length, 0);
  move(-10); near(client.state.values[1], -10); near(client.state.values[2], -15);
  assert.deepEqual(writes().slice(-2).map(m => m.address), [address(1), address(2)]);
  move(-147); near(client.state.values[1], -147); assert.equal(client.state.values[2], -150);
  move(-150); assert.equal(client.state.values[1], -150); assert.equal(client.state.values[2], -150);
  move(3); near(client.state.values[1], 3); near(client.state.values[2], -2);
  move(10); near(client.state.values[1], 10); near(client.state.values[2], 5);
  level(1, 0); level(2, -8);
  move(-10); near(client.state.values[1], -10); near(client.state.values[2], -18);
});
test('individually off channels stay off; manually raising them establishes a new balance', t => {
  const { client, level, move } = setup(t);
  level(1, -12); level(2, -150); move(0);
  near(client.state.values[1], 0); assert.equal(client.state.values[2], -150);
  level(2, -5); move(-6); near(client.state.values[2], -11);
});
test('group controls wait for every fresh member, ignore other AUX data and never send synthetic IDs', t => {
  const { client, level, move, writes } = setup(t);
  client.restoreValues({ '1:level': { 1: 0, 2: -5 } });
  assert.equal(client.displayValue(-1), 0); assert.equal(client.beginDrag(-1), null);
  level(1, 0); level(2, -5, 2); assert.equal(client.beginDrag(-1), null);
  level(2, -5); move(-10);
  assert(writes().every(m => !m.address.includes('/-')));
});
for (const change of ['aux', 'pan', 'refresh', 'background', 'ungroup'] as const) {
  test('group pending writes are cancelled on ' + change, async t => {
    const { client, level, writes } = setup(t); level(1, 0); level(2, -5);
    const token = client.beginDrag(-1)!; client.drag(token, 0.8);
    if (change === 'aux') client.selectAux(2);
    if (change === 'pan') client.setParameter('pan');
    if (change === 'refresh') client.refresh();
    if (change === 'background') client.disconnect(true);
    if (change === 'ungroup') client.configureGroups({});
    client.drag(token, 1); client.flush(token); await delay(50);
    assert.equal(writes().length, 0);
  });
}
test('member subscriptions update group even when only its quieter channel changes', t => {
  const { client, level } = setup(t); level(1, 0); level(2, -5);
  let updates = 0; const stop = client.subscribeChannel(-1, () => updates++);
  level(2, -8); assert.equal(updates, 1); stop();
});
test('remembered group balance survives reload at off but requires fresh live data', t => {
  const first = setup(t); first.level(1, 0); first.level(2, -5); first.move(-150);
  const next = setup(t); next.client.restoreGroupBalances(JSON.parse(JSON.stringify(first.client.getGroupBalances())));
  assert.equal(next.client.beginDrag(-1), null);
  next.level(1, -150); next.level(2, -150); next.move(0); near(next.client.state.values[2], -5);
  next.client.restoreGroupBalances({ '1:1,2': { offsets: { 1: 100, 2: -5 }, expected: { 1: -150, 2: -150 } } });
  assert.deepEqual(next.client.getGroupBalances(), {});
});
test('layout groups validate membership and render collapsed, expanded, pan and unavailable members safely', () => {
  const preferences = { ...emptyPreferences(), groupsByAux: { '1': [[1, 2]] } };
  assert(readPreferences(preferences));
  for (const groups of [[[1]], [[1, 1]], [[1, 2], [2, 3]], [[-1, 2]]]) assert.equal(readPreferences({ ...preferences, groupsByAux: { '1': groups } }), null);
  const parsed = parseConfig(config)!;
  const collapsed = mixerRows(parsed, preferences, 1, []);
  assert.deepEqual(collapsed.map(c => c.channel), [-1, 3]); assert.equal(collapsed[0].label, 'Guitar L / Guitar R');
  assert.deepEqual(mixerRows(parsed, preferences, 1, [-1]).map(c => c.channel), [-1, 1, 2, 3]);
  assert.deepEqual(mixerRows(parsed, preferences, 1, [], true).map(c => c.channel), [-1, 1, 2, 3]);
  assert.deepEqual(mixerRows(parsed, { ...preferences, hiddenByAux: { '1': [2] } }, 1, []).map(c => c.channel), [1, 3]);
  assert.deepEqual(mixerRows(parsed, preferences, 2, []).map(c => c.channel), [1, 2, 3]);
});
test('group creation and removal never write audio; membership persists per server and AUX', async () => {
  const data = new Map<string, string>(), writes: any[] = [], sockets: Socket[] = [];
  const make = () => new MixerSession({ getItem: async key => data.get(key) || null, setItem: async (key, value) => { data.set(key, value); } },
    () => { const socket: Socket = { readyState: 1, send: raw => writes.push(JSON.parse(raw)), close() {}, onopen: null, onclose: null, onmessage: null, onerror: null }; sockets.push(socket); return socket; },
    (async () => Response.json({ url: 'http://one/', qr: 'data:image/png;base64,AAA' })) as typeof fetch);
  const first = make(); await first.connect('one'); sockets.at(-1)!.onmessage?.({ data: JSON.stringify({ config }) });
  assert.equal(first.createGroup([1, 2]), true); assert.equal(first.createGroup([2, 3]), false);
  assert.equal(first.createGroup([1]), false); assert.equal(first.createGroup([1, 99]), false);
  first.disconnect(false); await delay(0);
  const next = make(); await next.connect('one');
  assert.deepEqual(next.state.preferences.groupsByAux, { '1': [[1, 2]] });
  await next.connect('two'); assert.deepEqual(next.state.preferences.groupsByAux, {});
  await next.connect('one'); sockets.at(-1)!.onmessage?.({ data: JSON.stringify({ config }) });
  next.removeGroup(1); assert.deepEqual(next.state.preferences.groupsByAux['1'], []);
  next.disconnect(false);
  assert.equal(writes.filter(m => m.address && !m.address.endsWith('/?')).length, 0);
});
