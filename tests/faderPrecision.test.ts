import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dbToPosition, levelText } from '../src/mixer/model';
import { dragLevel, releasePosition } from '../src/mixer/faderPrecision';

test('drag levels match displayed tenths and survive float32 OSC encoding', () => {
  for (const [input, expected] of [[-12.34, -12.3], [-12.36, -12.4], [0.049, 0], [0.051, 0.1], [-0.049, 0], [9.99, 10]]) {
    const level = dragLevel(dbToPosition(input));
    assert.equal(level, expected);
    assert.equal(levelText(Math.fround(level), 'level'), levelText(level, 'level'));
  }
  assert.equal(dragLevel(0), -150);
});
test('release holds small lift movements in either direction and accepts intentional final travel', () => {
  const target = dbToPosition(0);
  assert.equal(releasePosition(target + 0.002, target, 300), target);
  assert.equal(releasePosition(target - 0.002, target, 300), target);
  assert.equal(releasePosition(target + 0.02, target, 300), target + 0.02);
  assert.equal(releasePosition(target - 0.02, target, 300), target - 0.02);
  assert.equal(releasePosition(0, 0.004, 300), 0);
  assert.equal(releasePosition(1, 0.996, 300), 1);
});
