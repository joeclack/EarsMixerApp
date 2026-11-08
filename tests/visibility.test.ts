import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyPreferences, hiddenChannels, parseConfig, readPreferences } from '../src/mixer/model';

test('hidden channels persist per AUX and legacy templates retain visible channels', () => {
  const config = parseConfig({ channels: [1, 2, 3].map(channel => ({ channel, label: 'Channel ' + channel })), aux: [] });
  const legacy = { ...emptyPreferences(), favouritesByAux: { '2': { channels: [1, 3], enabled: true } } };
  assert.deepEqual(hiddenChannels(config, legacy, 2), [2]);
  assert.deepEqual(hiddenChannels(config, legacy, 3), []);
  const updated = readPreferences({ ...legacy, hiddenByAux: { '2': [], '3': [1, 1] } })!;
  assert.deepEqual(hiddenChannels(config, updated, 2), []);
  assert.deepEqual(hiddenChannels(config, updated, 3), [1]);
  assert.deepEqual(readPreferences(JSON.parse(JSON.stringify(updated)))?.hiddenByAux, { '2': [], '3': [1] });
  assert.equal(readPreferences({ ...legacy, hiddenByAux: { '2': [-1] } }), null);
});
