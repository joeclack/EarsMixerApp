import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MixerClient, type Socket } from '../src/mixer/client';
import { mixInUseText, type MixInUse } from '../src/mixer/mixInUse';

class FakeSocket implements Socket {
  readyState = 1; messages: any[] = [];
  onopen: Socket['onopen'] = null; onclose: Socket['onclose'] = null;
  onerror: Socket['onerror'] = null; onmessage: Socket['onmessage'] = null;
  send(raw: string) { this.messages.push(JSON.parse(raw)); }
  close() { this.readyState = 3; }
  receive(value: unknown) { this.onmessage?.({ data: JSON.stringify(value) }); }
}
const config = { channels: [{ channel: 1, label: 'Kick', enabled: true }], aux: [{ channel: 1, label: 'Drums IEM' }, { channel: 2, label: 'Keys IEM' }] };

function setup() {
  const sockets: FakeSocket[] = [], warnings: MixInUse[] = [];
  const client = new MixerClient(() => { const socket = new FakeSocket(); sockets.push(socket); return socket; });
  client.onMixInUse(warning => warnings.push(warning));
  const open = (preserve = false) => {
    client.connect('http://mixer.local/', preserve);
    const socket = sockets.at(-1)!; socket.onopen?.(); socket.receive({ config });
    return socket;
  };
  return { client, warnings, open };
}

test('arriving on a mix someone is on warns once, and again only after leaving and coming back', () => {
  const { client, warnings, open } = setup();
  client.selectAux(1);
  const socket = open();
  socket.receive({ presence: { aux: 1, peers: [{ id: '7', nickname: 'Sam' }] } });
  assert.deepEqual(warnings, [{ aux: 1, kind: 'peers', names: ['Sam'] }]);
  // Later presence on the same visit doesn't repeat it.
  socket.receive({ presence: { aux: 1, peers: [{ id: '7', nickname: 'Sam' }, { id: '8', nickname: null }] } });
  assert.equal(warnings.length, 1);
  // Coming back from the background reconnects without warning again.
  client.disconnect(true); const resumed = open(true);
  resumed.receive({ presence: { aux: 1, peers: [{ id: '7', nickname: 'Sam' }] } });
  assert.equal(warnings.length, 1);
  // Leaving the mix and returning is a new arrival.
  client.selectAux(2); resumed.receive({ presence: { aux: 2, peers: [] } });
  client.selectAux(1); resumed.receive({ presence: { aux: 1, peers: [{ id: '7', nickname: 'Sam' }] } });
  assert.equal(warnings.length, 2);
  client.disconnect();
});

test('a recent change by someone else warns; your own, old or missing changes do not', () => {
  const { client, warnings, open } = setup();
  client.selectAux(1);
  const socket = open();
  socket.receive({ presence: { aux: 1, peers: [], lastChange: { nickname: 'Joe', minutesAgo: 25, self: true } } });
  assert.equal(warnings.length, 0);
  client.selectAux(2); socket.receive({ presence: { aux: 2, peers: [], lastChange: { nickname: 'Sam', minutesAgo: 120, self: false } } });
  assert.equal(warnings.length, 0);
  client.selectAux(1); socket.receive({ presence: { aux: 1, peers: [], lastChange: { nickname: 'Sam', minutesAgo: 25, self: false } } });
  assert.deepEqual(warnings, [{ aux: 1, kind: 'recent', name: 'Sam', minutesAgo: 25 }]);
  // A fresh connection to the mixer is a new arrival on the saved mix.
  client.disconnect(); client.selectAux(1);
  open().receive({ presence: { aux: 1, peers: [] } });
  assert.equal(warnings.length, 1);
  client.disconnect();
});

test('warnings are in plain words', () => {
  assert.deepEqual(mixInUseText({ aux: 1, kind: 'peers', names: ['Sam'] }, 'Drums IEM'),
    { title: 'Someone else is using this mix', message: "Sam is also on Drums IEM right now. Any changes you make, they'll hear too." });
  assert.equal(mixInUseText({ aux: 1, kind: 'peers', names: ['Sam', null, 'Jo', 'Al'] }, 'Drums IEM').message.startsWith('Sam, Jo and 2 others are also on'), true);
  assert.equal(mixInUseText({ aux: 1, kind: 'peers', names: [null] }, 'Drums IEM').message.startsWith('Someone is also on'), true);
  assert.deepEqual(mixInUseText({ aux: 1, kind: 'recent', name: null, minutesAgo: 1 }, 'Drums IEM'),
    { title: 'Someone else may be using this mix', message: "Someone else changed Drums IEM 1 minute ago. Any changes you make, they'll hear too." });
  assert.equal(mixInUseText({ aux: 1, kind: 'recent', name: 'Sam', minutesAgo: 90 }, 'Drums IEM').message, "Sam changed Drums IEM over an hour ago. Any changes you make, they'll hear too.");
});
