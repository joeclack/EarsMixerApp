import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, cancelAnimation, Easing, withTiming, withSpring, withDelay, useReducedMotion, type SharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import FaderHandleSurface from './FaderHandleSurface';
import SignalMeter from './SignalMeter';
import { LinearGradient } from 'expo-linear-gradient';
import { FADER_CAP_HEIGHT, FADER_CAP_WIDTH, FADER_INSET, FADER_TRACK_CENTER, FADER_LIGHT } from './faderGeometry';
import { useDetentHaptics } from '../mixer/dragHaptics';
import * as Haptics from 'expo-haptics';
import { useFaderSession } from '../mixer/context';
import { useTheme } from '../theme';
import { clamp, levelText, dbToPosition } from '../mixer/model';
import type { DragToken } from '../mixer/client';
import { releasePosition } from '../mixer/faderPrecision';

// Long-press timing for opening the tall fader: a pause before any visible
// response, then a steady lift that ends exactly when the fader opens.
export const HOLD_DELAY = 30, HOLD_LIFT = 120, HOLD_SCALE = 1.04;

export default memo(function Fader({ channel, label, vertical = false, length = 200, size = 1, onEnlarge, pressScale }: { channel: number; label: string; vertical?: boolean; length?: number; size?: number; onEnlarge?: () => void; pressScale?: SharedValue<number> }) {
  const { session, mix } = useFaderSession(channel);
  const [width, setWidth] = useState(0);
  const ready = session.mixer.canDrag(channel);
  const muted = session.mixer.isMuted(channel);
  const position = session.mixer.position(channel);
  const thumb = useSharedValue(position);
  const start = useSharedValue(position);
  const active = useSharedValue(false);
  const lastDispatch = useSharedValue(0);
  const sampled = useSharedValue(position);
  const origin = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const localScale = useSharedValue(1);
  const holdAllowed = useSharedValue(false);
  const scale = pressScale || localScale;
  useEffect(() => { cancelAnimation(scale); scale.set(1); }, [mix.epoch, vertical, scale]);
  const drag = useRef<DragToken | null>(null);
  const detents = useDetentHaptics(session.state.settings.haptics);
  const inset = FADER_INSET * size;
  // A vertical strip's length is given, so its travel is right on the first
  // frame; only horizontal bars wait for their measured width.
  const extent = vertical ? length : width;
  const travel = Math.max(0, extent - inset * 2);
  const begin = useCallback((initial: number, epoch: number) => {
    if (epoch !== session.mixer.state.epoch) return;
    drag.current = session.mixer.beginDrag(channel);
    if (!drag.current) return;
    if (session.state.settings.haptics) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [session, channel]);
  const update = useCallback((next: number) => {
    if (!drag.current || drag.current.epoch !== session.mixer.state.epoch) return;
    session.mixer.drag(drag.current, next);
  }, [session]);
  const finish = useCallback((next: number, success: boolean) => {
    if (drag.current) {
      if (success) { session.mixer.drag(drag.current, next); session.mixer.flush(drag.current); }
      session.mixer.cancelDrag(drag.current);
    }
    drag.current = null; active.value = false;
    if (session.mixer.displayValue(channel) !== undefined) thumb.value = session.mixer.position(channel);
  }, [session, channel, active, thumb]);
  useEffect(() => {
    active.value = false;
    if (drag.current) session.mixer.cancelDrag(drag.current);
    drag.current = null;
  }, [mix.epoch, extent, vertical, session, active]);
  useEffect(() => () => { if (drag.current) session.mixer.cancelDrag(drag.current); }, [session]);
  useEffect(() => {
    let context = '';
    let previous: number | undefined;
    let epoch: number | undefined;
    const applyPosition = (next: number | undefined, snap: boolean, release: boolean) => {
      'worklet';
      if (release) active.value = false;
      if (next === undefined) { cancelAnimation(thumb); return; }
      if (snap) { active.value = false; cancelAnimation(thumb); thumb.value = next; }
      else if (!active.value) {
        // Small streamed desk updates stay responsive. Large automatic changes
        // glide from the currently displayed position, including mid-animation.
        const distance = Math.abs(next - thumb.value);
        const duration = Math.max(32, Math.min(240, distance * 400));
        thumb.value = withTiming(next, { duration, easing: Easing.out(Easing.cubic) });
      }
    };
    const syncPosition = () => {
      const current = session.mixer.state;
      // Missing AUX values are unknown, not off. Hold the current visual position
      // until a cached or live target exists, then glide to it.
      const nextContext = [current.aux, current.parameter].join('|');
      const release = epoch !== current.epoch;
      epoch = current.epoch;
      const next = session.mixer.displayValue(channel) === undefined ? undefined : session.mixer.position(channel);
      const snap = !context || context.split('|')[1] !== current.parameter;
      context = nextContext;
      if (!snap && !release && next === previous) return;
      previous = next;
      // Queue the newest target straight to the animation thread, without waiting
      // for a React render/effect. Touch gestures retain control while dragging.
      scheduleOnUI(applyPosition, next, snap, release);
    };
    syncPosition();
    return session.mixer.subscribeChannel(channel, syncPosition);
  }, [session, channel, thumb, active, vertical, extent]);
  const epoch = mix.epoch;
  const pressHaptic = useCallback(() => {
    if (session.state.settings.haptics) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }, [session]);
  const touchesHandle = useCallback((x: number, y: number) => {
    'worklet';
    const left = 4 + travel * thumb.get();
    const top = (56 - FADER_CAP_WIDTH) / 2;
    // Include a little edge tolerance so grabbing the cap never opens focus.
    return x >= left - 4 && x <= left + FADER_CAP_HEIGHT + 4 && y >= top - 4 && y <= top + FADER_CAP_WIDTH + 4;
  }, [travel, thumb]);
  // The hold charges continuously: after a short pause that lets scrolls and
  // drags claim the touch, the bar lifts steadily and opens as it reaches full
  // lift, with a single haptic at that moment.
  const enlarge = useMemo(() => Gesture.LongPress().enabled(!vertical && !!onEnlarge).minDuration(HOLD_DELAY + HOLD_LIFT).maxDistance(3).onTouchesDown((event, manager) => {
    'worklet';
    const touch = event.allTouches[0];
    if (touch && touchesHandle(touch.x, touch.y)) manager.fail();
  }).onBegin(event => {
    'worklet';
    holdAllowed.set(!touchesHandle(event.x, event.y));
    if (!holdAllowed.get() || reducedMotion) return;
    scale.set(withDelay(HOLD_DELAY, withTiming(HOLD_SCALE, { duration: HOLD_LIFT, easing: Easing.out(Easing.quad) })));
  }).onStart(() => {
    'worklet';
    if (!holdAllowed.get()) return;
    scheduleOnRN(pressHaptic);
    if (onEnlarge) scheduleOnRN(onEnlarge);
  }).onFinalize(() => {
    'worklet';
    if (!holdAllowed.get()) return;
    holdAllowed.set(false);
    scale.set(reducedMotion ? 1 : active.value ? withTiming(1, { duration: 80 }) : withSpring(1, { duration: 200, dampingRatio: 0.7 }));
  }), [vertical, onEnlarge, mix.epoch, reducedMotion, scale, active, pressHaptic, holdAllowed, touchesHandle]);
  const gesture = useMemo(() => {
    const pan = Gesture.Pan().enabled(ready && travel > 0).minDistance(3).simultaneousWithExternalGesture(enlarge);
    if (vertical) pan.activeOffsetY([-3, 3]).failOffsetX([-8, 8]);
    else pan.activeOffsetX([-3, 3]).failOffsetY([-8, 8]);
    return pan.onStart(event => {
      'worklet';
      cancelAnimation(thumb);
      scale.set(reducedMotion ? 1 : withTiming(1, { duration: 80 }));
      active.value = true; start.value = thumb.value; lastDispatch.value = 0;
      sampled.value = thumb.value;
      origin.value = vertical ? -event.translationY : event.translationX;
      detents.start(start.value * travel);
      scheduleOnRN(begin, start.value, epoch);
    }).onUpdate(event => {
      'worklet';
      const movement = (vertical ? -event.translationY : event.translationX) - origin.value;
      const next = Math.max(0, Math.min(1, start.value + movement / travel));
      thumb.value = next;
      detents.move(next * travel);
      const now = Date.now();
      if (now - lastDispatch.value >= 30) {
        lastDispatch.value = now; sampled.value = next; scheduleOnRN(update, next);
      }
    }).onFinalize((_event, success) => {
      'worklet';
      const final = success ? releasePosition(thumb.value, sampled.value, travel) : thumb.value;
      thumb.value = final;
      scheduleOnRN(finish, final, success);
    });
  }, [ready, travel, vertical, mix.epoch, thumb, start, active, lastDispatch, sampled, origin, begin, update, finish, enlarge, scale, reducedMotion, detents]);
  const thumbStyle = useAnimatedStyle(() => ({ transform: vertical ? [{ translateY: travel * (1 - thumb.value) }] : [{ translateX: travel * thumb.value }] }));
  const fillStyle = useAnimatedStyle(() => vertical ? { height: travel * thumb.value } : { width: travel * thumb.value });
  const theme = useTheme();
  return <GestureDetector gesture={enlarge}><View onLayout={vertical ? undefined : event => setWidth(event.nativeEvent.layout.width)} style={{ height: vertical ? length : 56, width: vertical ? 80 * size : undefined, alignSelf: vertical ? 'center' : undefined }}>
    {/* A slot cut through the panel, shaded at its top edge with a lit lower lip. */}
    <View pointerEvents="none" style={[vertical
      ? { position: 'absolute', top: inset - 4, bottom: inset - 4, left: FADER_TRACK_CENTER * size - 6, width: 12 }
      : { position: 'absolute', left: inset - 4, right: inset - 4, top: 22, height: 12 }, { borderRadius: 6, backgroundColor: '#010709',
      boxShadow: [{ inset: true, offsetX: 0, offsetY: 2, blurRadius: 2, color: 'rgba(0,0,0,0.9)' }, { offsetX: 0, offsetY: 1, blurRadius: 0, color: theme.deskLip }] }]} />
    <View pointerEvents="none" style={vertical
      ? { position: 'absolute', top: inset, bottom: inset, left: FADER_TRACK_CENTER * size - 4, width: 8, borderRadius: 4, backgroundColor: '#010709', justifyContent: 'flex-end' }
      : { position: 'absolute', left: inset, right: inset, top: 24, height: 8, borderRadius: 4, backgroundColor: '#010709' }}>
      {/* A muted send keeps its level; its light dims to show it is off in this mix. */}
      <Animated.View style={[vertical ? { width: 8 } : { height: 8 }, { opacity: muted ? 0.25 : 1, borderRadius: 4, backgroundColor: FADER_LIGHT,
        boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 6, spreadDistance: 1, color: '#12E6B970' }] }, fillStyle]}>
        <LinearGradient pointerEvents="none" colors={['#048E7B', '#1BEABD', '#7CFFE2', '#13D9AF']}
          locations={[0, 0.3, 0.6, 1]} start={vertical ? { x: 0, y: 0.5 } : { x: 0.5, y: 0 }}
          end={vertical ? { x: 1, y: 0.5 } : { x: 0.5, y: 1 }} style={{ position: 'absolute', inset: 0, borderRadius: 4 }} />
      </Animated.View>
    </View>
    <FaderScale width={extent} travel={travel} vertical={vertical} parameter={mix.parameter} color={FADER_LIGHT} size={size} />
    {/* Live input signal beside the slot; groups have none of their own. */}
    {channel > 0 && <SignalMeter mixer={session.mixer} channel={channel} vertical={vertical} start={inset} length={travel}
      offset={vertical ? FADER_TRACK_CENTER * size + 9 : 37} />}
    <GestureDetector gesture={gesture}><Animated.View accessible accessibilityRole="adjustable" accessibilityLabel={label + (mix.parameter === 'pan' ? ' pan' : ' level')}
      accessibilityHint={onEnlarge ? 'Touch and hold to open a full-screen fader' : undefined}
      accessibilityState={{ disabled: !ready }} accessibilityValue={{ min: 0, max: 100, now: Math.round(position * 100), text: levelText(session.mixer.displayValue(channel), mix.parameter) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }, ...(onEnlarge ? [{ name: 'expand', label: 'Open full-screen fader' }] : [])]} onAccessibilityAction={event => {
        if (event.nativeEvent.actionName === 'expand') { pressHaptic(); onEnlarge?.(); return; }
        const token = session.mixer.beginDrag(channel); if (!token) return;
        session.mixer.drag(token, clamp(position + (event.nativeEvent.actionName === 'increment' ? 0.02 : -0.02))); session.mixer.flush(token); session.mixer.cancelDrag(token);
        if (session.state.settings.haptics) void Haptics.selectionAsync().catch(() => {});
      }}
      style={[{ position: 'absolute', left: vertical ? (FADER_TRACK_CENTER - FADER_CAP_WIDTH / 2) * size : 4,
        top: vertical ? 4 * size : (56 - FADER_CAP_WIDTH) / 2,
        width: vertical ? FADER_CAP_WIDTH * size : FADER_CAP_HEIGHT, height: vertical ? FADER_CAP_HEIGHT * size : FADER_CAP_WIDTH,
        borderRadius: 8, backgroundColor: '#182125',
        shadowColor: '#000000', shadowOffset: { width: 1, height: 4 }, shadowOpacity: 0.7, shadowRadius: 4, elevation: 8 }, thumbStyle]}>
      <FaderHandleSurface vertical={vertical} size={size} />
    </Animated.View></GestureDetector>
  </View></GestureDetector>;
});

// The level as plain text beside or above its fader.
export const FaderValue = memo(function FaderValue({ channel }: { channel: number }) {
  const { session, mix } = useFaderSession(channel);
  const theme = useTheme();
  const value = levelText(session.mixer.displayValue(channel), mix.parameter);
  return <Text accessibilityLabel={value} numberOfLines={1} style={{ color: theme.muted, fontSize: 13, lineHeight: 18, fontWeight: '500', fontVariant: ['tabular-nums'] }}>{value}</Text>;
});


const FaderScale = memo(function FaderScale({ width, travel, vertical, parameter, color, size }: {
  width: number; travel: number; vertical: boolean; parameter: 'level' | 'pan'; color: string; size: number;
}) {
  const inset = FADER_INSET * size;
  const theme = useTheme();
  if (vertical) {
    const ink = theme.dark ? '#849BA5' : theme.consoleMark;
    const unityInk = theme.dark ? color : ink;
    const marks = parameter === 'level'
      ? [10, 5, 0, -5, -10, -20, -30, -40, -60].map(db => ({ position: dbToPosition(db), label: db > 0 ? '+' + db : String(db), major: db === 0 }))
      : [{ position: 1, label: 'R', major: false }, { position: 0.5, label: 'C', major: true }, { position: 0, label: 'L', major: false }];
    const spaced: typeof marks = [];
    for (const mark of marks) {
      const previous = spaced.at(-1);
      const tooClose = previous && travel * (previous.position - mark.position) < 15;
      if (tooClose && !mark.major) continue;
      if (tooClose) spaced.pop();
      spaced.push(mark);
    }
    const unity = inset + travel * (1 - dbToPosition(0));
    return <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
      {spaced.map(mark => {
        const point = inset + travel * (1 - mark.position);
        return <View key={mark.label} style={{ position: 'absolute', top: point, left: 0, right: 0 }}>
          {!(parameter === 'level' && mark.major) && <>
            <View style={{ position: 'absolute', left: 4, width: 18, height: 1, backgroundColor: mark.major ? unityInk : ink }} />
            <View style={{ position: 'absolute', right: 4, width: 14, height: 1, backgroundColor: mark.major ? unityInk : ink }} />
          </>}
          <Text style={{ position: 'absolute', left: 4, top: (mark.major ? -22 : -14) * size, fontSize: 9 * size, lineHeight: 12 * size, fontWeight: mark.major ? '800' : '600', color: theme.dark && mark.major ? '#E6F1F3' : ink }}>{mark.label}</Text>
        </View>;
      })}
      {parameter === 'level' && <>
        <View testID="unity-arrow-left" style={{ position: 'absolute', top: unity - 6, left: 5, width: 0, height: 0,
          borderTopWidth: 6, borderBottomWidth: 6, borderLeftWidth: 11, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: unityInk }} />
        <View testID="unity-arrow-right" style={{ position: 'absolute', top: unity - 6, right: 5, width: 0, height: 0,
          borderTopWidth: 6, borderBottomWidth: 6, borderRightWidth: 11, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: unityInk }} />
      </>}
    </View>;
  }
  const scaleText = theme.dark ? '#849BA5' : theme.consoleMark, scaleLine = theme.dark ? '#26383F' : '#A82B4066';
  const scale = parameter === 'level'
    ? [-40, -20, -10, 0, 10].map(db => ({ position: dbToPosition(db), label: db === 0 ? '0 dB' : db > 0 ? '+' + db : String(db), major: db === 0 }))
    : [{ position: 0, label: 'L', major: false }, { position: 0.5, label: 'C', major: true }, { position: 1, label: 'R', major: false }];
  return <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
      {Array.from({ length: 21 }, (_, index) => {
        const point = inset + travel * (vertical ? 1 - index / 20 : index / 20);
        return <View key={index} style={vertical
          ? { position: 'absolute', top: point, left: 23, width: index % 5 === 0 ? 9 : 5, height: 1, backgroundColor: scaleLine }
          : { position: 'absolute', left: point, top: 42, width: 1, height: index % 5 === 0 ? 8 : 4, backgroundColor: scaleLine }} />;
      })}
      {scale.map(mark => {
        const point = inset + travel * (vertical ? 1 - mark.position : mark.position);
        return <View key={mark.label} style={vertical
          ? { position: 'absolute', top: point - 6, left: 0, width: 33, height: 12, justifyContent: 'center' }
          : { position: 'absolute', left: Math.max(0, Math.min(width - 28, point - 14)), top: 0, width: 28, height: 25, alignItems: 'center' }}>
          <Text style={{ color: mark.major && theme.dark ? '#E6F1F3' : scaleText, fontSize: 8, fontWeight: mark.major ? '700' : '500', fontVariant: ['tabular-nums'] }}>{mark.label}</Text>
          <View style={vertical
            ? { position: 'absolute', left: 23, width: 9, height: 1, backgroundColor: mark.major ? color : scaleText }
            : { width: 1, height: 8, marginTop: 2, backgroundColor: mark.major && theme.dark ? color : scaleText }} />
        </View>;
      })}
      {!theme.dark && parameter === 'level' && <>
        <View style={{ position: 'absolute', left: inset + travel * dbToPosition(0) - 4, top: 16, width: 0, height: 0,
          borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: theme.consoleMark }} />
        <View style={{ position: 'absolute', left: inset + travel * dbToPosition(0) - 4, top: 34, width: 0, height: 0,
          borderLeftWidth: 4, borderRightWidth: 4, borderBottomWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: theme.consoleMark }} />
      </>}
    </View>;
});
