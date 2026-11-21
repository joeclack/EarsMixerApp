import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fillGradient, markerGradient, mute, shade } from '../src/mixer/channelColour';

test('channel colours are softened rather than shown exactly', () => {
  assert.equal(shade('#808080', 1), '#ffffff');
  assert.equal(shade('#808080', -1), '#000000');
  assert.equal(mute('#ff0000', 1), '#4c4c4c');
  assert.equal(mute('#ff0000', 0), '#ff0000');
  for (const colours of [markerGradient('#ff0000'), fillGradient('#ff0000')]) {
    assert(colours.every(colour => /^#[0-9a-f]{6}$/.test(colour)));
    assert(!colours.includes('#ff0000'));
  }
});
