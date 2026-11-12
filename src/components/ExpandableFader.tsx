import { useCallback, useRef, type ComponentRef } from 'react';
import type { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Fader from './Fader';
import FaderHousing from './FaderHousing';

export type FaderOrigin = { x: number; y: number; width: number; height: number };

export default function ExpandableFader({ channel, label, onEnlarge }: { channel: number; label: string; onEnlarge(origin?: FaderOrigin): void }) {
  const pressScale = useSharedValue(1);
  const ref = useRef<ComponentRef<typeof View>>(null);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.get() }] }));
  // Report the housing's on-screen frame so the tall fader can grow out of it.
  const enlarge = useCallback(() => {
    const view = ref.current;
    if (!view) { onEnlarge(); return; }
    view.measureInWindow((x, y, width, height) => onEnlarge(width > 0 ? { x, y, width, height } : undefined));
  }, [ref, onEnlarge]);
  return <Animated.View ref={ref} style={style}>
    <FaderHousing vertical={false}>
      <Fader channel={channel} label={label} onEnlarge={enlarge} pressScale={pressScale} />
    </FaderHousing>
  </Animated.View>;
}
