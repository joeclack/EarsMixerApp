import { useCallback, useRef, type ComponentRef } from 'react';
import type { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Fader from './Fader';
import FaderHousing from './FaderHousing';

export type FaderOrigin = { x: number; y: number; width: number; height: number };

// bare: no housing of its own, for faders set into the mixer's shared desk recess.
export default function ExpandableFader({ channel, label, onEnlarge, bare = false }: { channel: number; label: string; onEnlarge(origin?: FaderOrigin): void; bare?: boolean }) {
  const pressScale = useSharedValue(1);
  const ref = useRef<ComponentRef<typeof View>>(null);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.get() }] }));
  // Report the housing's on-screen frame so the tall fader can grow out of it.
  const enlarge = useCallback(() => {
    const view = ref.current;
    if (!view) { onEnlarge(); return; }
    view.measureInWindow((x, y, width, height) => onEnlarge(width > 0 ? { x, y, width, height } : undefined));
  }, [ref, onEnlarge]);
  const fader = <Fader channel={channel} label={label} onEnlarge={enlarge} pressScale={pressScale} />;
  return <Animated.View ref={ref} style={style}>
    {bare ? fader : <FaderHousing vertical={false}>{fader}</FaderHousing>}
  </Animated.View>;
}
