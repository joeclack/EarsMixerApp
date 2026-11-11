import { useCallback } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { detentAt, stepDetent } from './detents';

// Simulated fader detents: one light tick each time the handle travels a fixed
// distance on screen, regardless of the level it represents. Ticks are decided
// on the UI thread inside the drag gesture, so they follow the finger without
// waiting for React, and a fast swipe gives at most one tick per frame rather
// than queued bursts. A handle pinned at either end of its travel is silent.
export function useDetentHaptics(enabled: boolean) {
  const state = useSharedValue({ detent: 0, tickedAt: 0 });
  const tick = useCallback(() => { if (enabled) void Haptics.selectionAsync().catch(() => {}); }, [enabled]);
  // Call from the gesture's onStart with the handle's position in points.
  const start = useCallback((points: number) => {
    'worklet';
    state.set({ detent: detentAt(points), tickedAt: state.get().tickedAt });
  }, [state]);
  // Call from the gesture's onUpdate with the handle's new position in points.
  const move = useCallback((points: number) => {
    'worklet';
    const next = { ...state.get() };
    const play = stepDetent(next, points, Date.now());
    state.set(next);
    if (play) scheduleOnRN(tick);
  }, [state, tick]);
  return { start, move };
}
