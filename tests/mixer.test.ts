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
  assert.equal(writes()[0].args[0], positionToDb(0.7));
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
