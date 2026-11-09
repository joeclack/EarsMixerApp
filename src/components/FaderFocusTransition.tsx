import { useCallback, useLayoutEffect, useRef, useState, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme } from '../theme';
import FocusedFader from './FocusedFader';

type Target = { channel: number; label: string };
export default function FaderFocusTransition({ row, onClose, children }: PropsWithChildren<{ row?: Target; onClose(): void }>) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const [retained, setRetained] = useState(row);
  const generation = useRef(0);
  const clear = useCallback((id: number) => { if (id === generation.current) setRetained(undefined); }, []);
  useLayoutEffect(() => {
    const id = ++generation.current;
    if (row) setRetained(row);
    progress.set(withTiming(row ? 1 : 0, {
      duration: reducedMotion ? 120 : 180, easing: Easing.bezier(0.23, 1, 0.32, 1), reduceMotion: ReduceMotion.System,
    }, finished => { if (finished && !row) scheduleOnRN(clear, id); }));
    return () => { generation.current++; cancelAnimation(progress); };
  }, [row, progress, reducedMotion, clear]);
  const listStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.get() }));
  const focusStyle = useAnimatedStyle(() => ({ opacity: progress.get(), transform: [{ scale: reducedMotion ? 1 : 0.97 + 0.03 * progress.get() }] }));
  return <View style={{ flex: 1 }}>
    <Animated.View pointerEvents={row ? 'none' : 'auto'} accessibilityElementsHidden={!!row} importantForAccessibility={row ? 'no-hide-descendants' : 'auto'}
      style={[{ flex: 1 }, listStyle]}>{children}</Animated.View>
    {!!retained && <Animated.View pointerEvents={row ? 'auto' : 'none'} accessibilityElementsHidden={!row} importantForAccessibility={row ? 'auto' : 'no-hide-descendants'}
      style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg }, focusStyle]}>
      <FocusedFader channel={retained.channel} label={retained.label} onClose={onClose} />
    </Animated.View>}
  </View>;
}
