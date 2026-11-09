import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { MixerClient, type Socket } from '../src/mixer/client';
import { dbToPosition, positionToDb, readPreferences, parseConfig, emptyPreferences } from '../src/mixer/model';

class FakeSocket implements Socket {
  readyState = 1; messages: any[] = [];
  onopen: Socket['onopen'] = null; onclose: Socket['onclose'] = null;
  onerror: Socket['onerror'] = null; onmessage: Socket['onmessage'] = null;
  send(raw: string) { this.messages.push(JSON.parse(raw)); }
  close() { this.readyState = 3; }
  receive(value: unknown) { this.onmessage?.({ data: JSON.stringify(value) }); }
}
const config = {
  channels: [{ channel: 1, label: 'Voice', enabled: true }, { channel: 2, label: 'Keys', enabled: true }, { channel: 3, enabled: false }],
  aux: [{ channel: 1, label: 'Vocal IEM' }, { channel: 2, label: 'Keys IEM' }], snapshot: 'Soundcheck',
};
const address = (channel = 1, aux = 1, parameter = 'level') => '/Input_Channels/' + channel + '/Aux_Send/' + aux + '/send_' + parameter;
function setup(t: any) {
  const sockets: FakeSocket[] = [];
  const client = new MixerClient(() => { const socket = new FakeSocket(); sockets.push(socket); return socket; });
  client.connect('http://mixer.local/');
  const socket = sockets[0]; socket.onopen?.(); socket.receive({ config });
  const level = (value = -12, channel = 1, aux = 1, parameter = 'level') => socket.receive({ address: address(channel, aux, parameter), args: [value] });
  const writes = () => socket.messages.filter(m => m.address && !m.address.endsWith('/?'));
  t.after(() => client.disconnect());
  return { client, socket, level, writes, sockets };
}
test('native configuration filters disabled channels and layout validation drops audio state', () => {
  assert.equal(parseConfig(config)?.channels.length, 2);
  assert.equal(parseConfig(null), null);
  assert.equal(readPreferences({ ...emptyPreferences(), channelOrder: [-1] }), null);
  assert.deepEqual(readPreferences({ ...emptyPreferences(), levels: [10], pan: [0] }), emptyPreferences());
  for (const value of [-60, -30, -12, 0, 10]) assert.ok(Math.abs(positionToDb(dbToPosition(value)) - value) < 1e-8);
  assert.equal(positionToDb(0), -150); assert.equal(dbToPosition(-150), 0);
});
test('connecting and restoring a mix sends only reads; unknown channels cannot be moved', async t => {
  const { client, level, writes, socket } = setup(t);
  assert.equal(client.beginDrag(1), null);
  level(-12, 1, 2); assert.equal(client.beginDrag(1), null);
  level(); assert.ok(client.beginDrag(1));
  assert.equal(client.beginDrag(3), null);
  await delay(30);
  assert.equal(writes().length, 0);
  assert.ok(socket.messages.some(m => m.address === address(2) + '/?'));
});
test('handle movement is throttled and released at its final value', async t => {
  const { client, level, writes } = setup(t); level();
  const token = client.beginDrag(1)!;
  assert.equal(writes().length, 0, 'grabbing the handle cannot change the level');
  client.drag(token, 0.5); client.drag(token, 0.7);
  assert.equal(writes().length, 0);
  client.flush(token);
  assert.equal(writes().length, 1); assert.equal(writes()[0].address, address());
  assert.equal(writes()[0].args[0], 2.3);
  await delay(50); assert.equal(writes().length, 1);
});
for (const change of ['aux', 'parameter', 'snapshot', 'disconnect', 'navigation'] as const) {
  test('pending writes and active gestures are cancelled on ' + change, async t => {
    const { client, level, writes, socket } = setup(t); level();
    const token = client.beginDrag(1)!; client.drag(token, 0.9);
    if (change === 'aux') client.selectAux(2);
    if (change === 'parameter') client.setParameter('pan');
    if (change === 'snapshot') socket.receive({ address: '/MixReload', args: [] });
    if (change === 'disconnect') client.disconnect();
    if (change === 'navigation') client.cancelWrites();
    client.drag(token, 1); client.flush(token);
    await delay(55); assert.equal(writes().length, 0);
  });
}
test('navigation cancellation leaves outstanding read queries running', async t => {
  const { client, socket } = setup(t); client.cancelWrites();
  await delay(30);
  assert.ok(socket.messages.some(m => m.address === address(2) + '/?'));
});
test('remote labels update natively and invalid values never enable a fader', t => {
  const { client, socket, level, writes } = setup(t);
  level(200); assert.equal(client.beginDrag(1), null);
  socket.receive({ address: '/Input_Channels/1/Channel_Input/name', args: ['Lead vocal'] });
  socket.receive({ address: '/Aux_Outputs/1/Buss_Trim/name', args: ['Singer'] });
  assert.equal(client.state.config?.channels[0].label, 'Lead vocal');
  assert.equal(client.state.config?.aux[0].label, 'Singer');
  assert.equal(writes().length, 0);
});
test('pan uses desk range 0 to 1 and a disconnected client never replays changes', t => {
  const { client, level, writes, sockets } = setup(t);
  client.setParameter('pan'); level(0.5, 1, 1, 'pan');
  const token = client.beginDrag(1)!;
  client.drag(token, 0.25); client.flush(token);
  assert.equal(writes()[0].args[0], 0.25);
  client.drag(token, 1); client.connect('http://other-mixer.local/');
  sockets[1].receive({ config });
  assert.equal(client.beginDrag(1), null);
  assert.equal(sockets[1].messages.filter(m => m.address && !m.address.endsWith('/?')).length, 0);
});

test('optimistic dragging updates immediately and ignores delayed desk values until release', t => {
  const { client, level, writes } = setup(t);
  level(-12);
  let updates = 0;
  const unsubscribe = client.subscribe(() => updates++);
  const token = client.beginDrag(1)!;
  client.drag(token, 0.8); client.drag(token, 0.85);
  assert.equal(client.state.values[1], 6.5);
  assert.equal(updates, 0);
  client.flush(token);
  assert.equal(writes().length, 1);
  assert.equal(writes()[0].args[0], 6.5);
  level(-50);
  assert.equal(client.state.values[1], 6.5);
  client.cancelDrag(token);
  level(-15);
  assert.equal(client.state.values[1], -15);
  unsubscribe();
});

test('released tenths remain stable after float32 feedback while real desk adjustments stay live', t => {
  const { client, level, writes } = setup(t); level(-12);
  const token = client.beginDrag(1)!;
  client.drag(token, dbToPosition(-12.34)); client.flush(token); client.cancelDrag(token);
  assert.equal(writes().at(-1).args[0], -12.3);
  level(Math.fround(-12.3));
  assert.equal(Number(client.state.values[1].toFixed(1)), -12.3);
  level(-12.4); assert.equal(client.state.values[1], -12.4);
});

test('set all levels off writes minus infinity for every channel in the current AUX and leaves pan alone', async t => {
  const { client, level, writes } = setup(t);
  level(-12);
  const drag = client.beginDrag(1)!;
  client.drag(drag, 0.9);
  assert.equal(client.setAllLevelsOff(1), true);
  await delay(40);
  assert.equal(writes().length, 2);
  assert(writes().every(message => message.address.includes('/Aux_Send/1/send_level') && message.args[0] === -150));
  assert.equal(client.state.values[1], -150);
  assert.equal(client.state.values[2], -150);
  client.setParameter('pan'); level(0.75, 1, 1, 'pan');
  assert.equal(client.setAllLevelsOff(1), true);
  assert.equal(client.state.values[1], 0.75);
  assert.equal(writes().length, 4);
  assert(writes().every(message => message.address.endsWith('/send_level') && message.args[0] === -150));
  assert.equal(client.setAllLevelsOff(2), false);
  assert.equal(writes().length, 4);
});

test('AUX presence accepts only current peers, updates names and clears on switches and disconnect', t => {
  const { client, socket, writes } = setup(t);
  const peers = () => client.state.peers;
  socket.receive({ presence: { aux: 2, peers: [{ id: '2', nickname: 'Wrong AUX' }] } });
  assert.deepEqual(peers(), []);
  socket.receive({ presence: { aux: 1, peers: [{ id: '2', nickname: '  Drummer  ' }, { id: '3', nickname: null },
    { id: '2', nickname: 'Duplicate' }, { id: 'bad', nickname: 'Bad ID' }, { id: '4', nickname: {} }] } });
  assert.deepEqual(peers(), [{ id: '2', nickname: 'Drummer' }, { id: '3', nickname: null }]);
  socket.receive({ presence: { aux: 1, peers: [{ id: '2', nickname: 'Joe' }] } });
  assert.equal(peers()[0].nickname, 'Joe');
  client.selectAux(2);
  assert.deepEqual(peers(), []);
  socket.receive({ presence: { aux: 1, peers: [{ id: '2', nickname: 'Late old message' }] } });
  assert.deepEqual(peers(), []);
  socket.receive({ presence: { aux: 2, peers: [{ id: '3', nickname: 'Singer' }] } });
  assert.equal(peers()[0].nickname, 'Singer');
  socket.receive({ presence: { aux: 2, peers: [] } });
  assert.deepEqual(peers(), []);
  socket.receive({ presence: { aux: 2, peers: [{ id: '3', nickname: 'Singer' }] } });
  client.disconnect(true);
  assert.deepEqual(peers(), []);
  assert.equal(writes().length, 0);
});

test('desk position bursts reach only the moving channel immediately without publishing page controls', t => {
  const { client, level, socket } = setup(t);
  level(-40, 1); level(-20, 2);
  const controls = client.controlsSnapshot();
  let pageUpdates = 0, otherChannelUpdates = 0;
  const positions: number[] = [];
  const unsubscribePage = client.subscribeControls(() => pageUpdates++);
  const unsubscribeChannel = client.subscribeChannel(1, () => positions.push(client.position(1)));
  const unsubscribeOther = client.subscribeChannel(2, () => otherChannelUpdates++);
  for (let i = 1; i <= 120; i++) {
    level(-40 + i / 3, 1);
    assert.equal(positions.length, i); // No render, timer or polling is needed to deliver the target.
  }
  assert.equal(positions.at(-1), dbToPosition(0));
  assert.equal(client.controlsSnapshot(), controls);
  assert.equal(pageUpdates, 0); assert.equal(otherChannelUpdates, 0);
  level(0, 1); // Identical repeated packets do not notify the handle again.
  assert.equal(positions.length, 120);
  socket.receive({ address: '/Aux_Outputs/1/Buss_Trim/name', args: ['Drums'] });
  assert.equal(pageUpdates, 1); assert.equal(client.controlsSnapshot().config?.aux[0].label, 'Drums');
  unsubscribeChannel(); level(-10, 1);
  assert.equal(positions.length, 120);
  unsubscribePage(); unsubscribeOther();
});

test('AUX and mode switches publish empty fresh values atomically rather than values from the previous mix', t => {
  const { client, level } = setup(t);
  level(-10, 1);
  const observed: number[] = [];
  const unsubscribe = client.subscribeChannel(1, () => {
    if (client.state.values[1] !== undefined) observed.push(client.state.values[1]);
  });
  client.selectAux(2);
  assert.deepEqual(observed, []);
  level(-20, 1, 2);
  observed.length = 0;
  client.setParameter('pan');
  assert.deepEqual(observed, []);
  level(0.7, 1, 2, 'pan');
  assert.deepEqual(observed, [0.7]);
  unsubscribe();
});
