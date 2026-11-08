import test from 'node:test';
import assert from 'node:assert/strict';
import { DragHaptics } from '../src/mixer/dragHaptics';

test('quick travel produces a bounded burst and cancelled gestures leave no queued pulses', t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
  let pulses = 0;
  const haptics = new DragHaptics(() => pulses++);
  haptics.begin(0);
  haptics.move(0.01);
  assert.equal(pulses, 1);
  t.mock.timers.tick(25); haptics.move(0.02);
  assert.equal(pulses, 2);
  haptics.move(0.8);
  assert.equal(pulses, 3);
  haptics.end(true);
  t.mock.timers.tick(36);
  assert.equal(pulses, 5);
  haptics.begin(0.8); haptics.move(0.1);
  assert.equal(pulses, 6);
  haptics.end(); t.mock.timers.tick(1000);
  assert.equal(pulses, 6);
});
