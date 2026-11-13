import { memo, useEffect } from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { MixerClient } from '../mixer/client';

// The meter reads -60 dBFS to 0 dBFS. It is the channel's input signal, not
// its send level, so it moves independently of the fader.
const FLOOR = -60;
const toFraction = (db: number | null) => db === null ? 0 : Math.max(0, Math.min(1, (db - FLOOR) / -FLOOR));
const WIDTH = 3;

// A thin signal meter beside a fader's slot. It shows nothing until readings
// arrive, and empties again when they stop or the connection drops.
export default memo(function SignalMeter({ mixer, channel, vertical, start, length, offset }: {
  mixer: MixerClient; channel: number; vertical: boolean;
  /** Where the meter begins along the travel axis, and its length. */
  start: number; length: number;
  /** Its distance from the fader's top (horizontal) or left (vertical) edge. */
  offset: number;
}) {
  const level = useSharedValue(0);
  const present = useSharedValue(0);
  const clip = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  useEffect(() => mixer.onMeter(channel, db => {
    const next = toFraction(db);
    // A fast rise and a slower fall, like a peak meter's ballistics.
    level.set(reducedMotion ? next : withTiming(next, { duration: next >= level.get() ? 60 : 280, easing: Easing.out(Easing.quad) }));
    present.set(withTiming(db === null ? 0 : 1, { duration: 200 }));
    if (db !== null && db >= 0) {
      cancelAnimation(clip);
      clip.set(1);
      clip.set(withDelay(1200, withTiming(0, { duration: 300 })));
    } else if (db === null) clip.set(0);
  }), [mixer, channel, level, present, clip, reducedMotion]);
  const fill = useAnimatedStyle(() => vertical ? { height: length * level.get() } : { width: length * level.get() });
  const shown = useAnimatedStyle(() => ({ opacity: present.get() * 0.9 }));
  const clipStyle = useAnimatedStyle(() => ({ opacity: clip.get() }));
  if (length <= 0) return null;
  const box = vertical
    ? { position: 'absolute' as const, left: offset, top: start, width: WIDTH, height: length }
    : { position: 'absolute' as const, top: offset, left: start, height: WIDTH, width: length };
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={box}>
    <Animated.View style={[{ position: 'absolute', inset: 0, borderRadius: WIDTH / 2, backgroundColor: 'rgba(1,7,9,0.55)' }, shown]}>
      <Animated.View style={[vertical ? { position: 'absolute', left: 0, right: 0, bottom: 0 } : { position: 'absolute', top: 0, bottom: 0, left: 0 },
        { overflow: 'hidden', borderRadius: WIDTH / 2 }, fill]}>
        {/* The scale's colours stay fixed along the meter; the level uncovers them. */}
        <LinearGradient colors={['#1BEABD', '#1BEABD', '#F5C542', '#FF5A4E']} locations={[0, 0.7, 0.88, 1]}
          start={vertical ? { x: 0, y: 1 } : { x: 0, y: 0 }} end={vertical ? { x: 0, y: 0 } : { x: 1, y: 0 }}
          style={vertical ? { position: 'absolute', left: 0, right: 0, bottom: 0, height: length } : { position: 'absolute', top: 0, bottom: 0, left: 0, width: length }} />
      </Animated.View>
    </Animated.View>
    {/* Clip: a red mark at the top of the scale that holds briefly. */}
    <Animated.View style={[vertical ? { position: 'absolute', left: -1.5, top: -8, width: 6, height: 6 } : { position: 'absolute', top: -1.5, right: -8, width: 6, height: 6 },
      { borderRadius: 3, backgroundColor: '#FF3B30', boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 4, color: '#FF3B30AA' }] }, clipStyle]} />
  </View>;
});
