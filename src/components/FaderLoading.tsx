import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, View } from 'react-native';
import Animated, { cancelAnimation, cubicBezier, Easing, interpolate, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme } from '../theme';

const positions = [
  [18, 64, 8, 42, 18],
  [56, 12, 46, 4, 56],
  [34, 6, 64, 20, 34],
];
const motions = positions.map(points => ({
  '0%': { transform: [{ translateY: points[0] }] },
  '25%': { transform: [{ translateY: points[1] }] },
  '50%': { transform: [{ translateY: points[2] }] },
  '75%': { transform: [{ translateY: points[3] }] },
  '100%': { transform: [{ translateY: points[4] }] },
}));
const easing = cubicBezier(0.77, 0, 0.175, 1);

export default function FaderLoading({ finishing = false, onFinished }: { finishing?: boolean; onFinished?: () => void }) {
  const theme = useTheme();
  const systemReducedMotion = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(systemReducedMotion);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const exit = useSharedValue(0);
  const finish = useRef(onFinished);
  const completed = useRef(false);
  const generation = useRef(0);
  useEffect(() => { finish.current = onFinished; }, [onFinished]);
  const complete = useCallback((id: number) => {
    if (id !== generation.current || completed.current) return;
    completed.current = true;
    finish.current?.();
  }, []);
  useEffect(() => {
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    const lifecycle = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => { motion.remove(); lifecycle.remove(); };
  }, []);
  // A cancellable progress value also handles loading restarting or the app
  // backgrounding mid-exit. Only completion crosses back to the React runtime.
  useEffect(() => {
    const id = ++generation.current;
    if (!finishing) { completed.current = false; exit.set(0); }
    else if (active) exit.set(withTiming(1, { duration: reducedMotion ? 140 : 650,
      easing: Easing.bezier(0.77, 0, 0.175, 1), reduceMotion: ReduceMotion.Never }, finished => {
      if (finished) scheduleOnRN(complete, id);
    }));
    return () => { generation.current++; cancelAnimation(exit); };
  }, [finishing, active, reducedMotion, exit, complete]);
  // Let the faders visibly approach before they grow beyond the screen and fade.
  const surfaceStyle = useAnimatedStyle(() => ({ opacity: reducedMotion ? 1 - exit.get() : interpolate(exit.get(), [0, 0.65, 1], [1, 1, 0]) }));
  const fadersStyle = useAnimatedStyle(() => ({ transform: [{ scale: reducedMotion ? 1 : interpolate(exit.get(), [0, 0.65, 1], [1, 3, 12]) }] }));
  return <Animated.View testID="loading-faders" accessibilityLabel="Loading mixer" accessibilityRole="progressbar" accessibilityState={{ busy: !finishing }}
    style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg, overflow: 'hidden' }, surfaceStyle]}>
    <Animated.View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none"
      style={[{ flexDirection: 'row', gap: 30, padding: 20 }, fadersStyle]}>
      {positions.map((points, index) => <View key={index} style={{ width: 22, height: 92, alignItems: 'center' }}>
        <View style={{ width: 4, height: 84, borderRadius: 2, backgroundColor: theme.secondary }} />
        <Animated.View style={{ position: 'absolute', top: 4, left: 0, width: 22, height: 12, borderRadius: 4,
          backgroundColor: theme.tint, borderWidth: 1, borderColor: theme.dark ? '#A5FFF0' : '#005B52',
          transform: [{ translateY: points[0] }],
          ...(!reducedMotion ? { animationName: motions[index], animationDuration: 1800 + index * 180,
            animationIterationCount: 'infinite', animationTimingFunction: easing, animationPlayState: active && !finishing ? 'running' : 'paused' } : {}) }} />
      </View>)}
    </Animated.View>
  </Animated.View>;
}
