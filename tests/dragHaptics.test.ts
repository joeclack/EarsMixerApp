import test from 'node:test';
import assert from 'node:assert/strict';
import { DETENT, MIN_INTERVAL, detentAt, stepDetent } from '../src/mixer/detents';

test('ticks follow handle travel, not level values', () => {
  const state = { detent: detentAt(0), tickedAt: -Infinity };
  let ticks = 0, now = 1000;
  for (let points = 0; points <= DETENT * 10; points++) { now += MIN_INTERVAL; if (stepDetent(state, points, now)) ticks++; }
  assert.equal(ticks, 10);
});

test('crossing several detents in one frame plays one tick', () => {
  const state = { detent: detentAt(0), tickedAt: -Infinity };
  assert.equal(stepDetent(state, DETENT * 8, 1000), true);
  assert.equal(stepDetent(state, DETENT * 9, 1000 + MIN_INTERVAL / 2), false);
  assert.equal(stepDetent(state, DETENT * 10, 1000 + MIN_INTERVAL), true);
});

test('a handle held at the end of its travel stays silent', () => {
  const state = { detent: detentAt(200), tickedAt: -Infinity };
  for (let now = 1000; now < 1200; now += MIN_INTERVAL) assert.equal(stepDetent(state, 200, now), false);
});
