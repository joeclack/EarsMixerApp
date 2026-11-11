import { useCallback, useLayoutEffect, useRef, useState, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, interpolate, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import AppBackground from './AppBackground';
import FocusedFader from './FocusedFader';
import type { FaderOrigin } from './ExpandableFader';

type Target = { channel: number; label: string };
// A soft, decelerating curve close to the system's own zoom transitions.
const curve = Easing.bezier(0.32, 0.72, 0, 1);
const OPEN_DURATION = 360, CLOSE_DURATION = 300, REDUCED_DURATION = 150;

// The pressed bar becomes the full-screen fader: a panel grows from the bar's
// exact frame and pill shape to fill the mixer, the tall fader fades in as it
// grows, and the list recedes behind it. Closing shrinks back into the same bar.
// With Reduce Motion this is a short crossfade.
export default function FaderFocusTransition({ row, origin, onClose, children }: PropsWithChildren<{ row?: Target; origin?: FaderOrigin; onClose(): void }>) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const [retained, setRetained] = useState(row);
  const generation = useRef(0);
  const root = useRef<View>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const bounds = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });
  const from = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });
  const clear = useCallback((id: number) => { if (id === generation.current) setRetained(undefined); }, []);
  const measure = useCallback(() => {
    root.current?.measureInWindow((x, y, width, height) => { if (width > 0) bounds.set({ x, y, width, height }); });
  }, [bounds]);
  useLayoutEffect(() => {
    const id = ++generation.current;
    if (row) {
      setRetained(row);
      const area = bounds.get();
      // Convert the bar's window frame into this view's space; without one,
      // grow from a bar across the middle of the list.
      from.set(origin && area.width ? { x: origin.x - area.x, y: origin.y - area.y, width: origin.width, height: origin.height }
        : { x: 20, y: Math.max(0, area.height / 2 - 34), width: Math.max(0, area.width - 40), height: 68 });
    }
    progress.set(withTiming(row ? 1 : 0, {
      duration: reducedMotion ? REDUCED_DURATION : row ? OPEN_DURATION : CLOSE_DURATION, easing: curve, reduceMotion: ReduceMotion.Never,
    }, finished => { if (finished && !row) scheduleOnRN(clear, id); }));
    return () => { generation.current++; cancelAnimation(progress); };
  }, [row, origin, progress, reducedMotion, clear, bounds, from]);

  const listStyle = useAnimatedStyle(() => {
    const p = progress.get();
    return { opacity: interpolate(p, [0, 0.7], [1, 0], 'clamp'), transform: [{ scale: reducedMotion ? 1 : 1 - 0.04 * p }] };
  });
  // The panel animates its frame and clips a full-size, fixed layer, so the
  // tall fader lays out once and never re-measures during the animation.
  const panelStyle = useAnimatedStyle(() => {
    const p = progress.get(), f = from.get(), { width, height } = bounds.get();
    if (reducedMotion || !f.width) return { left: 0, top: 0, width, height, borderRadius: 0, opacity: p };
    return {
      left: f.x * (1 - p), top: f.y * (1 - p),
      width: f.width + (width - f.width) * p, height: f.height + (height - f.height) * p,
      borderRadius: (f.height / 2) * (1 - p), opacity: interpolate(p, [0, 0.12], [0, 1], 'clamp'),
    };
  });
  const layerStyle = useAnimatedStyle(() => {
    const p = progress.get(), f = from.get();
    if (reducedMotion || !f.width) return { left: 0, top: 0 };
    return { left: -f.x * (1 - p), top: -f.y * (1 - p) };
  });
  const faderStyle = useAnimatedStyle(() => {
    const p = progress.get(), f = from.get(), { height } = bounds.get();
    if (reducedMotion || !f.width) return { opacity: p };
    // Drift up or down from the pressed bar while settling into place.
    const drift = (f.y + f.height / 2 - height / 2) * 0.25 * (1 - p);
    return { opacity: interpolate(p, [0.3, 0.9], [0, 1], 'clamp'), transform: [{ translateY: drift }, { scale: 0.94 + 0.06 * p }] };
  });

  return <View ref={root} style={{ flex: 1 }} onLayout={event => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height }); bounds.set({ ...bounds.get(), width, height }); measure();
  }}>
    <Animated.View pointerEvents={row ? 'none' : 'auto'} accessibilityElementsHidden={!!row} importantForAccessibility={row ? 'no-hide-descendants' : 'auto'}
      style={[{ flex: 1 }, listStyle]}>{children}</Animated.View>
    {!!retained && <Animated.View pointerEvents={row ? 'auto' : 'none'} accessibilityElementsHidden={!row} importantForAccessibility={row ? 'auto' : 'no-hide-descendants'}
      style={[{ position: 'absolute', overflow: 'hidden' }, panelStyle]}>
      <Animated.View style={[{ position: 'absolute', width: size.width, height: size.height }, layerStyle]}>
        <AppBackground />
        <Animated.View style={[StyleSheet.absoluteFill, faderStyle]}>
          <FocusedFader channel={retained.channel} label={retained.label} onClose={onClose} />
        </Animated.View>
      </Animated.View>
    </Animated.View>}
  </View>;
}
