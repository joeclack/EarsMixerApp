// Pure detent logic shared by the drag haptics hook and its tests.
export const DETENT = 7; // points of handle travel per tick
export const MIN_INTERVAL = 16; // milliseconds; at most one tick per display frame

export type DetentState = { detent: number; tickedAt: number };

export function detentAt(points: number) {
  'worklet';
  return Math.round(points / DETENT);
}

// Returns whether a tick should play for the handle's new position, updating
// the state in place. Crossing several detents at once plays a single tick.
export function stepDetent(state: DetentState, points: number, now: number) {
  'worklet';
  const next = detentAt(points);
  if (next === state.detent) return false;
  state.detent = next;
  if (now - state.tickedAt < MIN_INTERVAL) return false;
  state.tickedAt = now;
  return true;
}
