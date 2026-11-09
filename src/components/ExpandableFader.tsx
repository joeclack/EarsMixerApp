import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Fader from './Fader';
import FaderHousing from './FaderHousing';

export default function ExpandableFader({ channel, label, onEnlarge }: { channel: number; label: string; onEnlarge(): void }) {
  const pressScale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.get() }] }));
  return <Animated.View style={style}>
    <FaderHousing vertical={false}>
      <Fader channel={channel} label={label} onEnlarge={onEnlarge} pressScale={pressScale} />
    </FaderHousing>
  </Animated.View>;
}
