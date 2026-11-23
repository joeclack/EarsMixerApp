import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyPreferences, orderedChannels, parseConfig } from '../src/mixer/model';
import { mixerRows } from '../src/mixer/groups';
import { layoutItems } from '../src/mixer/layout';

const raw = {
  channels: [{ channel: 1, label: 'Kick', order: 1 }, { channel: 2, label: 'Gtr 1 L', order: 2, colour: '#e5484d' },
    { channel: 3, label: 'Gtr 1 R', order: 3 }, { channel: 4, label: 'Vocal', order: 4 }],
  aux: [{ channel: 1, label: 'Vox 1 IEM' }],
  links: [{ name: 'Guitar 1', channels: [2, 3] }],
};

test('a server link becomes one channel with the link name, keeping both channels for values', () => {
  const config = parseConfig(raw)!;
  // Both channels stay in the config, so the client loads and updates both.
  assert.deepEqual(config.channels.map(c => c.channel), [1, 2, 3, 4]);
  const first = config.channels.find(c => c.channel === 2)!, second = config.channels.find(c => c.channel === 3)!;
  assert.deepEqual([first.label, first.deskLabel, first.partner, first.colour], ['Guitar 1', 'Gtr 1 L', 3, '#e5484d']);
  assert.equal(second.linkedTo, 2);
  // Musicians arrange the pair as one channel.
  assert.deepEqual(orderedChannels(config, emptyPreferences()).map(c => c.label), ['Kick', 'Guitar 1', 'Vocal']);
  assert.deepEqual(layoutItems(config, emptyPreferences(), 1).map(item => item.label), ['Kick', 'Guitar 1', 'Vocal']);
});

test('a linked pair is one fader for level and both desk channels for pan', () => {
  const config = parseConfig(raw)!;
  const level = mixerRows(config, emptyPreferences(), 1, []);
  assert.deepEqual(level.map(row => [row.channel, row.label]), [[1, 'Kick'], [2, 'Guitar 1'], [4, 'Vocal']]);
  const pan = mixerRows(config, emptyPreferences(), 1, [], true);
  assert.deepEqual(pan.map(row => [row.channel, row.label]), [[1, 'Kick'], [2, 'Gtr 1 L'], [3, 'Gtr 1 R'], [4, 'Vocal']]);
  assert.equal(pan.find(row => row.channel === 2)!.partner, undefined);
  // Inside a group, pan mode splits the pair under the group too.
  const preferences = { ...emptyPreferences(), globalGroups: [{ id: 1, name: 'Band', members: [1, 2] }] };
  const grouped = mixerRows(config, preferences, 1, [], true);
  assert.deepEqual(grouped.map(row => [row.channel, row.label, row.group]),
    [[-1, 'Band', -1], [1, 'Kick', -1], [2, 'Gtr 1 L', -1], [3, 'Gtr 1 R', -1], [4, 'Vocal', undefined]]);
  // The group header doesn't take the link from its member.
  assert.equal(mixerRows(config, preferences, 1, [])[0].partner, undefined);
});

test('invalid or partial links are ignored, and older servers without links are unchanged', () => {
  const ignored = parseConfig({ ...raw, links: [{ name: '', channels: [2, 3] }, { name: 'Missing', channels: [2, 9] },
    { name: 'Same', channels: [1, 1] }, { name: 'One', channels: [1] }, 'nonsense', { name: 'Kick & Vocal', channels: [1, 4] }, { name: 'Reuses 1', channels: [1, 2] }] })!;
  assert.deepEqual(ignored.channels.filter(c => c.partner !== undefined).map(c => [c.channel, c.label, c.partner]), [[1, 'Kick & Vocal', 4]]);
  assert.equal(ignored.channels.find(c => c.channel === 2)!.partner, undefined);
  const older = parseConfig({ channels: raw.channels, aux: raw.aux })!;
  assert.ok(older.channels.every(c => c.partner === undefined && c.linkedTo === undefined));
  assert.equal(orderedChannels(older, emptyPreferences()).length, 4);
});
