import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { MixerClient, type Socket } from '../src/mixer/client';
import { MixerSession } from '../src/mixer/session';
import { dbToPosition, emptyPreferences, readPreferences, parseConfig } from '../src/mixer/model';
import { mixerRows, mixerSections, moveGroupMembers } from '../src/mixer/groups';

const config = { channels: [{ channel: 1, label: 'Guitar L' }, { channel: 2, label: 'Guitar R' }, { channel: 3, label: 'Vocal' }],
  aux: [{ channel: 1, label: 'Drums' }, { channel: 2, label: 'Vocals' }] };
const address = (id: number, aux = 1) => `/Input_Channels/${id}/Aux_Send/${aux}/send_level`;
function setup(t: any) {
  const messages: any[] = [];
  const socket: Socket = { readyState: 1, send: raw => messages.push(JSON.parse(raw)), close() {}, onopen: null, onclose: null, onerror: null, onmessage: null };
  const client = new MixerClient(() => socket);
  client.configureGroups({ '1': [{ id: 1, name: '', members: [1, 2] }] });
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
  const preferences = readPreferences({ ...emptyPreferences(), groupsByAux: { '1': [[1, 2]] } })!;
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
  assert.equal(first.createGroup([1, 2]), true);
  const group = first.state.preferences.groupsByAux['1'][0]; assert.equal(first.createGroup([2, 3]), false);
  assert.equal(first.createGroup([1]), false); assert.equal(first.createGroup([1, 99]), false);
  first.disconnect(false); await delay(0);
  const next = make(); await next.connect('one');
  assert.deepEqual(next.state.preferences.groupsByAux, { '1': [group] });
  await next.connect('two'); assert.deepEqual(next.state.preferences.groupsByAux, {});
  await next.connect('one'); sockets.at(-1)!.onmessage?.({ data: JSON.stringify({ config }) });
  next.removeGroup(group.id); assert.deepEqual(next.state.preferences.groupsByAux['1'], []);
  next.disconnect(false);
  assert.equal(writes.filter(m => m.address && !m.address.endsWith('/?')).length, 0);
});

test('expanded groups own their member strips in one section, including pan and nonadjacent channel order', () => {
  const parsed = parseConfig(config)!;
  const preferences = readPreferences({ ...emptyPreferences(), groupsByAux: { '1': [[1, 3]] } })!;
  const closed = mixerSections(mixerRows(parsed, preferences, 1, []));
  assert.deepEqual(closed.map(section => section.header.channel), [-1, 2]);
  assert.equal(closed[0].channels.length, 0);
  for (const pan of [false, true]) {
    const opened = mixerSections(mixerRows(parsed, preferences, 1, pan ? [] : [-1], pan));
    assert.deepEqual(opened.map(section => section.header.channel), [-1, 2]);
    assert.deepEqual(opened[0].channels.map(channel => channel.channel), [1, 3]);
    assert.equal(opened[1].channels.length, 0);
    assert(opened[0].channels.every(channel => channel.group === opened[0].header.channel));
  }
  const hidden = mixerSections(mixerRows(parsed, { ...preferences, hiddenByAux: { '1': [3] } }, 1, [-1]));
  assert.deepEqual(hidden.map(section => section.header.channel), [1, 2]);
  assert(hidden.every(section => !section.channels.length));
});

test('legacy groups migrate without changing virtual IDs and named groups validate independently of membership order', () => {
  const migrated = readPreferences({ ...emptyPreferences(), groupsByAux: { '1': [[2, 1], [3, 4]] } })!;
  assert.deepEqual(migrated.groupsByAux['1'], [{ id: 2, name: '', members: [2, 1] }, { id: 3, name: '', members: [3, 4] }]);
  const group = { id: 100, name: '  Guitars  ', members: [2, 1] };
  const named = readPreferences({ ...emptyPreferences(), groupsByAux: { '1': [group] } })!;
  assert.equal(named.groupsByAux['1'][0].name, 'Guitars');
  const rows = mixerRows(parseConfig(config), named, 1, [-100]);
  assert.deepEqual(rows.map(row => row.channel), [-100, 2, 1, 3]);
  assert.equal(rows[0].label, 'Guitars');
  for (const groups of [
    [{ ...group, id: 0 }], [{ ...group, id: Number.MAX_SAFE_INTEGER + 1 }],
    [{ ...group, name: 'x'.repeat(81) }], [{ ...group, members: [2] }], [{ ...group, members: [2, 2] }],
    [group, { id: 100, name: 'Other', members: [3, 4] }], [group, { id: 101, name: '', members: [2, 3] }],
  ]) assert.equal(readPreferences({ ...emptyPreferences(), groupsByAux: { '1': groups } }), null);
  const unnamed = readPreferences({ ...named, groupsByAux: { '1': [{ ...group, name: '   ' }] } })!;
  assert.equal(mixerRows(parseConfig(config), unnamed, 1, [])[0].label, 'Guitar R / Guitar L');
});

test('member order follows native multi-row move semantics and keyboard arrows', () => {
  assert.deepEqual(moveGroupMembers([1, 2, 3], [0], 2), [2, 1, 3]);
  assert.deepEqual(moveGroupMembers([1, 2, 3], [2], 1), [1, 3, 2]);
  assert.deepEqual(moveGroupMembers([1, 2, 3, 4], [3, 1], 0), [2, 4, 1, 3]);
  assert.deepEqual(moveGroupMembers([1, 2, 3, 4], [1], 4), [1, 3, 4, 2]);
  assert.deepEqual(moveGroupMembers([1, 2], [4], 0), [1, 2]);
  assert.deepEqual(moveGroupMembers([1, 2], [0], -1), [1, 2]);
});

function groupSession(t: any, data = new Map<string, string>()) {
  const writes: any[] = [], sockets: Socket[] = [];
  const session = new MixerSession({ getItem: async key => data.get(key) || null, setItem: async (key, value) => { data.set(key, value); } },
    () => { const socket: Socket = { readyState: 1, send: raw => writes.push(JSON.parse(raw)), close() {}, onopen: null, onclose: null, onmessage: null, onerror: null }; sockets.push(socket); return socket; },
    (async () => Response.json({ url: 'http://one/', qr: 'data:image/png;base64,AAA' })) as typeof fetch);
  const receive = (value: unknown) => sockets.at(-1)!.onmessage?.({ data: JSON.stringify(value) });
  const largeConfig = { ...config, channels: Array.from({ length: 6 }, (_, i) => ({ channel: i + 1, label: 'Channel ' + (i + 1) })) };
  const connect = async () => { await session.connect('one'); sockets.at(-1)!.onopen?.(); receive({ config: largeConfig }); };
  t.after(() => session.disconnect(false));
  return { session, connect, receive, data, largeConfig, scope: { server: 'http://one/', aux: 1 },
    writes: () => writes.filter(message => message.address && !message.address.endsWith('/?')) };
}

test('group editor creates, renames, reorders, changes membership and bulk deletes atomically without writing audio', async t => {
  const { session, connect, receive, largeConfig, scope, writes } = groupSession(t);
  await connect();
  session.preferences({ hiddenByAux: { '1': [5, 6] } });
  const first = session.saveGroup(null, 'Guitars', [1, 2], scope)!;
  const second = session.saveGroup(null, 'Vocals', [3, 4], scope)!;
  assert(first && second && first !== second);
  assert.equal(session.saveGroup(first, 'Renamed', [2, 1], scope), first);
  assert.deepEqual(session.state.preferences.groupsByAux['1'][0], { id: first, name: 'Renamed', members: [2, 1] });
  const beforeInvalid = JSON.stringify(session.state.preferences);
  for (const members of [[1], [2, 2], [2, 3], [2, 99]]) assert.equal(session.saveGroup(first, 'Invalid', members, scope), null);
  assert.equal(session.saveGroup(999, 'Missing', [1, 2], scope), null);
  assert.equal(session.saveGroup(first, 'x'.repeat(81), [1, 2], scope), null);
  assert.equal(JSON.stringify(session.state.preferences), beforeInvalid);
  assert.equal(session.saveGroup(first, 'Renamed', [2, 1, 5], scope), first);
  assert.deepEqual(session.state.preferences.hiddenByAux['1'], [6]);
  assert.equal(session.saveGroup(first, 'Renamed', [2, 5], scope), first);
  // A missing desk channel may stay in an existing group while its name/order
  // is edited; unavailable channels cannot be newly added to another group.
  receive({ config: { ...largeConfig, channels: largeConfig.channels.filter(channel => channel.channel !== 5) } });
  assert.equal(session.saveGroup(first, 'Unavailable member', [5, 2], scope), first);
  assert.equal(session.saveGroup(second, 'Invalid', [3, 4, 5], scope), null);
  assert.equal(session.deleteGroups([first, 999], scope), false);
  assert.equal(session.state.preferences.groupsByAux['1'].length, 2);
  assert.equal(session.deleteGroups([], scope), false);
  assert.equal(session.deleteGroups([first, second], scope), true);
  assert.deepEqual(session.state.preferences.groupsByAux['1'], []);
  assert.equal(session.deleteGroups([first], scope), false);
  assert.equal(writes().length, 0);
});

test('editor scope rejects stale saves and deletes after AUX or server changes', async t => {
  const { session, connect, receive, scope, writes } = groupSession(t);
  await connect();
  const first = session.saveGroup(null, 'First mix', [1, 2], scope)!;
  assert.equal(session.saveGroup(first, 'Wrong server', [1, 2], { ...scope, server: 'http://two/' }), null);
  assert.equal(session.deleteGroups([first], { ...scope, aux: 2 }), false);
  session.mixer.selectAux(2);
  const second = session.saveGroup(null, 'Second mix', [1, 2], { ...scope, aux: 2 })!;
  assert.equal(session.saveGroup(first, 'Stale edit', [2, 1], scope), null);
  assert.equal(session.deleteGroups([second], scope), false);
  assert.equal(session.state.preferences.groupsByAux['1'][0].name, 'First mix');
  assert.equal(session.state.preferences.groupsByAux['2'][0].name, 'Second mix');
  session.disconnect(false);
  assert.equal(session.saveGroup(first, 'Disconnected', [1, 2], scope), null);
  assert.equal(session.deleteGroups([first], scope), false);
  assert.equal(writes().length, 0);
});

test('upgraded group names, IDs, member order and remembered offsets survive persistence and reorder at off', async t => {
  const data = new Map<string, string>([
    ['earsmixer.native.profile:http://one/', JSON.stringify({ preferences: { ...emptyPreferences(), selectedAux: 1, groupsByAux: { '1': [[1, 2]] } } })],
    ['earsmixer.native.group-balances:http://one/', JSON.stringify({ '1:1,2': { offsets: { 1: 0, 2: -5 }, expected: { 1: -150, 2: -150 } } })],
  ]);
  const first = groupSession(t, data);
  await first.connect(); first.receive({ address: address(1), args: [-150] }); first.receive({ address: address(2), args: [-150] });
  assert.equal(first.session.saveGroup(1, 'Guitars', [2, 1], first.scope), 1);
  assert.equal(first.writes().length, 0);
  const token = first.session.mixer.beginDrag(-1)!; assert(token);
  first.session.mixer.drag(token, dbToPosition(0)); first.session.mixer.flush(token); first.session.mixer.cancelDrag(token);
  assert.equal(first.session.mixer.state.values[1], 0); assert.equal(first.session.mixer.state.values[2], -5);
  first.session.disconnect(false); await delay(0);
  const next = groupSession(t, data); await next.connect();
  assert.deepEqual(next.session.state.preferences.groupsByAux['1'], [{ id: 1, name: 'Guitars', members: [2, 1] }]);
  assert.equal(mixerRows(next.session.mixer.state.config, next.session.state.preferences, 1, [])[0].label, 'Guitars');
  assert.equal(next.writes().length, 0);
});

test('bulk deleting groups cancels active and queued group gestures', async t => {
  const { session, connect, receive, scope, writes } = groupSession(t);
  await connect();
  const first = session.saveGroup(null, '', [1, 2], scope)!;
  const second = session.saveGroup(null, '', [3, 4], scope)!;
  for (const id of [1, 2, 3, 4]) receive({ address: address(id), args: [-5] });
  const token = session.mixer.beginDrag(-first)!; assert(token);
  session.mixer.drag(token, 0.8);
  assert.equal(session.deleteGroups([first, second], scope), true);
  session.mixer.flush(token); await delay(50);
  assert.equal(writes().length, 0);
});

test('groups for all AUXes prevent overlapping local groups, reveal selected hidden channels and can change scope', async t => {
  const { session, connect, largeConfig, scope, writes } = groupSession(t);
  await connect();
  session.preferences({ groupsByAux: { '2': [{ id: 201, name: 'Other mix', members: [2, 3] }] }, hiddenByAux: { '1': [1, 2, 6], '2': [1, 2] } });
  assert.equal(session.saveGroup(null, 'All mixes', [1, 2], scope, true), null);
  const id = session.saveGroup(null, 'Guitars', [1, 2], scope, false)!;
  assert(id);
  assert.equal(session.saveGroup(id, 'Guitars', [1, 2], scope, true), null);
  session.mixer.selectAux(2); assert.equal(session.deleteGroups([201], { ...scope, aux: 2 }), true);
  session.mixer.selectAux(1);
  assert.equal(session.saveGroup(id, 'Guitars', [1, 2], scope, true), id);
  assert.deepEqual(session.state.preferences.globalGroups, [{ id, name: 'Guitars', members: [1, 2] }]);
  assert.deepEqual(session.state.preferences.groupsByAux['1'], []);
  assert.deepEqual(session.state.preferences.hiddenByAux['1'], [6]);
  assert.deepEqual(session.state.preferences.hiddenByAux['2'], []);
  for (const aux of [1, 2]) assert.equal(mixerRows(parseConfig(largeConfig), session.state.preferences, aux, [])[0].channel, -id);
  session.mixer.selectAux(2);
  assert.equal(session.saveGroup(id, 'Every mix', [2, 1], { ...scope, aux: 2 }), id);
  assert.equal(session.state.preferences.globalGroups[0].name, 'Every mix');
  assert.equal(session.saveGroup(null, 'Overlap', [1, 4], { ...scope, aux: 2 }, false), null);
  assert.equal(session.saveGroup(id, 'Only second mix', [2, 1], { ...scope, aux: 2 }, false), id);
  assert.deepEqual(session.state.preferences.globalGroups, []);
  assert.equal(mixerRows(parseConfig(largeConfig), session.state.preferences, 1, []).some(row => row.channel === -id), false);
  assert.equal(mixerRows(parseConfig(largeConfig), session.state.preferences, 2, [])[0].label, 'Only second mix');
  assert.equal(writes().length, 0);
});

test('groups for all AUXes remember different level balances for each AUX, including through rename and all-off', t => {
  const { client, level, writes } = setup(t);
  client.configureGroups({}, [{ id: 10, name: 'Shared guitars', members: [1, 2] }]);
  const move = (db: number) => {
    const token = client.beginDrag(-10); assert(token);
    client.drag(token, dbToPosition(db)); client.flush(token); client.cancelDrag(token);
  };
  level(1, 0); level(2, -5); move(-150);
  client.selectAux(2); level(1, -10, 2); level(2, -20, 2); move(-150);
  client.configureGroups({}, [{ id: 10, name: 'Renamed', members: [2, 1] }]);
  move(0); near(client.state.values[1], 0); near(client.state.values[2], -10);
  client.selectAux(1); level(1, -150); level(2, -150); move(0);
  near(client.state.values[1], 0); near(client.state.values[2], -5);
  assert(writes().every(message => !message.address.includes('/-')));
  assert.deepEqual(writes().slice(-2).map(message => message.address).sort(), [address(1), address(2)]);
});

test('groups for all mixes persist only on this device profile for the chosen server and delete from every AUX', async t => {
  const fixture = groupSession(t); await fixture.connect();
  const id = fixture.session.saveGroup(null, 'All mixes', [1, 2], fixture.scope, true)!;
  fixture.session.disconnect(false); await delay(0);
  const next = groupSession(t, fixture.data); await next.connect();
  assert.deepEqual(next.session.state.preferences.globalGroups, [{ id, name: 'All mixes', members: [1, 2] }]);
  await next.session.connect('two'); assert.deepEqual(next.session.state.preferences.globalGroups, []);
  await next.connect(); next.session.mixer.selectAux(2);
  assert.equal(next.session.deleteGroups([id], { ...next.scope, aux: 2 }), true);
  for (const aux of [1, 2]) assert(mixerRows(next.session.mixer.state.config, next.session.state.preferences, aux, []).every(row => row.channel > 0));
  assert.equal(next.writes().length, 0);
});

test('global and per-AUX groups validate as a disjoint effective layout', () => {
  const globalGroups = [{ id: 10, name: 'Global', members: [1, 2] }];
  assert(readPreferences({ ...emptyPreferences(), globalGroups, groupsByAux: { '1': [{ id: 20, name: 'Local', members: [3, 4] }] } }));
  assert.equal(readPreferences({ ...emptyPreferences(), globalGroups, groupsByAux: { '2': [{ id: 20, name: 'Overlap', members: [2, 4] }] } }), null);
  assert.equal(readPreferences({ ...emptyPreferences(), globalGroups, groupsByAux: { '2': [{ id: 10, name: 'Duplicate ID', members: [3, 4] }] } }), null);
});
