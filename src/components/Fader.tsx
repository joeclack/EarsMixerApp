import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { DragHaptics } from '../mixer/dragHaptics';
import * as Haptics from 'expo-haptics';
import { useFaderSession } from '../mixer/context';
import { useTheme } from '../theme';
import { clamp, levelText, dbToPosition } from '../mixer/model';
import type { DragToken } from '../mixer/client';

export default function Fader({ channel, label, color, vertical = false, length = 200 }: { channel: number; label: string; color: string; vertical?: boolean; length?: number }) {
  const { session, mix } = useFaderSession(channel);
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const ready = mix.status === 'connected' && mix.values[channel] !== undefined;
  const position = session.mixer.position(channel);
  const thumb = useSharedValue(position);
  const start = useSharedValue(position);
  const active = useSharedValue(false);
  const lastDispatch = useSharedValue(0);
  const drag = useRef<DragToken | null>(null);
  const haptics = useRef(new DragHaptics(() => { void Haptics.selectionAsync().catch(() => {}); })).current;
  const inset = vertical ? 26 : 20;
  const travel = Math.max(0, width - inset * 2);
  const begin = useCallback((initial: number, epoch: number) => {
    if (epoch !== session.mixer.state.epoch) return;
    drag.current = session.mixer.beginDrag(channel);
    haptics.begin(initial); setDragging(!!drag.current);
  }, [session, channel, haptics]);
  const update = useCallback((next: number) => {
    if (!drag.current || drag.current.epoch !== session.mixer.state.epoch) return;
    haptics.move(next);
    session.mixer.drag(drag.current, next);
  }, [session, haptics]);
  const finish = useCallback((next: number, success: boolean) => {
    if (drag.current) {
      if (success) { session.mixer.drag(drag.current, next); session.mixer.flush(drag.current); }
      session.mixer.cancelDrag(drag.current);
    }
    drag.current = null; haptics.end(success); active.value = false; thumb.value = session.mixer.position(channel); setDragging(false);
  }, [session, channel, haptics, active, thumb]);
  useEffect(() => {
    active.value = false;
    if (drag.current) session.mixer.cancelDrag(drag.current);
    drag.current = null; haptics.end(); setDragging(false);
  }, [mix.epoch, width, vertical, session, haptics, active]);
  useEffect(() => () => { if (drag.current) session.mixer.cancelDrag(drag.current); haptics.end(); }, [session, haptics]);
  useEffect(() => { if (!active.value) thumb.value = position; }, [position, mix.epoch, width, vertical, thumb, active]);
  const epoch = mix.epoch;
  const gesture = useMemo(() => {
    const pan = Gesture.Pan().enabled(ready && travel > 0).minDistance(3);
    if (vertical) pan.activeOffsetY([-3, 3]).failOffsetX([-8, 8]);
    else pan.activeOffsetX([-3, 3]).failOffsetY([-8, 8]);
    return pan.onStart(() => {
      'worklet';
      active.value = true; start.value = thumb.value; lastDispatch.value = 0;
      scheduleOnRN(begin, start.value, epoch);
    }).onUpdate(event => {
      'worklet';
      const movement = vertical ? -event.translationY : event.translationX;
      const next = Math.max(0, Math.min(1, start.value + movement / travel));
      thumb.value = next;
      const now = Date.now();
      if (now - lastDispatch.value >= 30) {
        lastDispatch.value = now; scheduleOnRN(update, next);
      }
    }).onFinalize((_event, success) => {
      'worklet';
      scheduleOnRN(finish, thumb.value, success);
    });
  }, [ready, travel, vertical, mix.epoch, thumb, start, active, lastDispatch, begin, update, finish]);
  const thumbStyle = useAnimatedStyle(() => ({ transform: vertical ? [{ translateY: travel * (1 - thumb.value) }] : [{ translateX: travel * thumb.value }] }));
  const fillStyle = useAnimatedStyle(() => vertical ? { height: travel * thumb.value } : { width: travel * thumb.value });
  const scale = mix.parameter === 'level'
    ? [-40, -20, -10, 0, 10].map(db => ({ position: dbToPosition(db), label: db === 0 ? '0 dB' : db > 0 ? '+' + db : String(db), major: db === 0 }))
    : [{ position: 0, label: 'L', major: false }, { position: 0.5, label: 'C', major: true }, { position: 1, label: 'R', major: false }];
  return <View onLayout={event => setWidth(vertical ? event.nativeEvent.layout.height : event.nativeEvent.layout.width)} style={{ height: vertical ? length : 56, width: vertical ? 64 : undefined, alignSelf: vertical ? 'center' : undefined, opacity: session.mixer.displayValue(channel) !== undefined ? 1 : 0.35 }}>
    <View pointerEvents="none" style={vertical
      ? { position: 'absolute', top: inset, bottom: inset, left: 34, width: 6, borderRadius: 3, backgroundColor: '#050A0D', justifyContent: 'flex-end' }
      : { position: 'absolute', left: inset, right: inset, top: 25, height: 6, borderRadius: 3, backgroundColor: '#050A0D' }}>
      <Animated.View style={[vertical ? { width: 6 } : { height: 6 }, { borderRadius: 3, backgroundColor: color, opacity: 0.6 }, fillStyle]} />
    </View>
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
      {Array.from({ length: 21 }, (_, index) => {
        const point = inset + travel * (vertical ? 1 - index / 20 : index / 20);
        return <View key={index} style={vertical
          ? { position: 'absolute', top: point, left: 23, width: index % 5 === 0 ? 9 : 5, height: 1, backgroundColor: theme.line }
          : { position: 'absolute', left: point, top: 42, width: 1, height: index % 5 === 0 ? 8 : 4, backgroundColor: theme.line }} />;
      })}
      {scale.map(mark => {
        const point = inset + travel * (vertical ? 1 - mark.position : mark.position);
        return <View key={mark.label} style={vertical
          ? { position: 'absolute', top: point - 6, left: 0, width: 33, height: 12, justifyContent: 'center' }
          : { position: 'absolute', left: Math.max(0, Math.min(width - 28, point - 14)), top: 0, width: 28, height: 25, alignItems: 'center' }}>
          <Text style={{ color: mark.major ? theme.text : theme.muted, fontSize: 8, fontWeight: mark.major ? '700' : '400', fontVariant: ['tabular-nums'] }}>{mark.label}</Text>
          <View style={vertical
            ? { position: 'absolute', left: 23, width: 9, height: 1, backgroundColor: mark.major ? color : theme.muted }
            : { width: 1, height: 8, marginTop: 2, backgroundColor: mark.major ? color : theme.muted }} />
        </View>;
      })}
    </View>
    <GestureDetector gesture={gesture}><Animated.View accessible accessibilityRole="adjustable" accessibilityLabel={label + (mix.parameter === 'pan' ? ' pan' : ' level')}
      accessibilityState={{ disabled: !ready }} accessibilityValue={{ min: 0, max: 100, now: Math.round(position * 100), text: levelText(session.mixer.displayValue(channel), mix.parameter) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]} onAccessibilityAction={event => {
        const token = session.mixer.beginDrag(channel); if (!token) return;
        session.mixer.drag(token, clamp(position + (event.nativeEvent.actionName === 'increment' ? 0.02 : -0.02))); session.mixer.flush(token);
        void Haptics.selectionAsync().catch(() => {});
      }}
      style={[{ position: 'absolute', left: vertical ? 23 : 6, top: vertical ? 4 : 10,
        width: 28, height: vertical ? 44 : 36, borderRadius: 4,
        backgroundColor: '#18232B', borderWidth: 1, borderColor: dragging ? '#728893' : '#435560',
        shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 3, elevation: 4,
        alignItems: 'center', justifyContent: 'center' }, thumbStyle]}>
      <View pointerEvents="none" style={{ position: 'absolute', left: 2, right: 2, top: 1, height: 2, borderRadius: 1, backgroundColor: '#A5B8BF', opacity: 0.35 }} />
      <View pointerEvents="none" style={{ flexDirection: vertical ? 'column' : 'row', gap: 4 }}>
        {Array.from({ length: vertical ? 5 : 4 }, (_, index) => <View key={index} style={{ width: vertical ? 18 : 2, height: vertical ? 2 : 22, backgroundColor: '#03090C', borderRadius: 1 }}>
          <View style={{ flex: 1, backgroundColor: color, opacity: ready ? (index === 2 || dragging ? 1 : 0.65) : 0.25,
            borderRadius: 1, shadowColor: color, shadowOpacity: 0.9, shadowRadius: dragging ? 5 : 3, shadowOffset: { width: 0, height: 0 } }} />
        </View>)}
      </View>
    </Animated.View></GestureDetector>
  </View>;
}

export function FaderValue({ channel }: { channel: number }) {
  const { session, mix } = useFaderSession(channel);
  const theme = useTheme();
  return <Text style={{ color: theme.muted, fontSize: 12, fontVariant: ['tabular-nums'] }}>{levelText(session.mixer.displayValue(channel), mix.parameter)}</Text>;
}
