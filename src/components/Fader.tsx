import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { clamp, levelText, dbToPosition } from '../mixer/model';
import type { DragToken } from '../mixer/client';

export default function Fader({ channel, label, color, vertical = false, length = 200 }: { channel: number; label: string; color: string; vertical?: boolean; length?: number }) {
  const { session, mix } = useSession();
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const thumb = useRef(new Animated.Value(session.mixer.position(channel))).current;
  const latest = useRef({ width, mix, vertical });
  latest.current = { width, mix, vertical };
  const drag = useRef<{ token: DragToken; start: number; moved: boolean; finger: number; pulsed: number; motionAt: number } | null>(null);
  const feedback = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopFeedback = () => { if (feedback.current) clearInterval(feedback.current); feedback.current = null; };
  const pulse = () => {
    const current = drag.current;
    if (!current || current.token.epoch !== session.mixer.state.epoch || Date.now() - current.motionAt > 100 || Math.abs(current.finger - current.pulsed) < 0.5) return;
    current.pulsed = current.finger;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
  };
  const cancel = () => {
    stopFeedback();
    if (drag.current) session.mixer.cancelDrag(drag.current.token);
    drag.current = null; setDragging(false);
  };
  useEffect(() => { cancel(); }, [mix.epoch, width, vertical]);
  useEffect(() => () => { stopFeedback(); if (drag.current) session.mixer.cancelDrag(drag.current.token); }, [session]);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => latest.current.mix.status === 'connected' && latest.current.mix.values[channel] !== undefined,
    onMoveShouldSetPanResponder: (_event, gesture) => (latest.current.vertical ? Math.abs(gesture.dy) > Math.abs(gesture.dx) : Math.abs(gesture.dx) > Math.abs(gesture.dy)),
    onPanResponderGrant: () => {
      const token = session.mixer.beginDrag(channel);
      if (!token) return;
      const start = session.mixer.position(channel);
      drag.current = { token, start, moved: false, finger: 0, pulsed: 0, motionAt: 0 };
    },
    onPanResponderMove: (_event, gesture) => {
      const current = drag.current;
      if (!current || current.token.epoch !== session.mixer.state.epoch || latest.current.width <= (latest.current.vertical ? 52 : 40)) return;
      const movement = latest.current.vertical ? -gesture.dy : gesture.dx;
      const cross = latest.current.vertical ? gesture.dx : gesture.dy;
      if (!current.moved && Math.abs(cross) > Math.abs(movement) + 5) { cancel(); return; }
      if (!current.moved && Math.abs(movement) < 3) return;
      if (!current.moved) {
        current.moved = true; setDragging(true);
      }
      const travel = latest.current.width - (latest.current.vertical ? 52 : 40);
      const position = clamp(current.start + movement / travel);
      thumb.setValue(position);
      // Keep a movement-driven feedback loop alive for the gesture. Network
      // values and release/settling never trigger feedback.
      const finger = position * travel;
      if (finger !== current.finger) { current.finger = finger; current.motionAt = Date.now(); }
      if (!feedback.current) {
        pulse();
        feedback.current = setInterval(pulse, 45);
      }
      session.mixer.drag(current.token, position);
    },
    onPanResponderRelease: () => {
      if (drag.current?.moved) session.mixer.flush(drag.current.token);
      cancel();
    },
    onPanResponderTerminate: cancel,
    onPanResponderTerminationRequest: () => !drag.current?.moved,
  }), [channel, session]);
  const ready = mix.status === 'connected' && mix.values[channel] !== undefined;
  const position = session.mixer.position(channel);
  useEffect(() => { if (!drag.current?.moved) thumb.setValue(position); }, [position, mix.epoch, width, vertical, thumb]);
  const inset = vertical ? 26 : 20;
  const travel = Math.max(0, width - inset * 2);
  const scale = mix.parameter === 'level'
    ? [-40, -20, -10, 0, 10].map(db => ({ position: dbToPosition(db), label: db === 0 ? '0 dB' : db > 0 ? '+' + db : String(db), major: db === 0 }))
    : [{ position: 0, label: 'L', major: false }, { position: 0.5, label: 'C', major: true }, { position: 1, label: 'R', major: false }];
  return <View onLayout={event => setWidth(vertical ? event.nativeEvent.layout.height : event.nativeEvent.layout.width)} style={{ height: vertical ? length : 72, width: vertical ? 64 : undefined, alignSelf: vertical ? 'center' : undefined, opacity: session.mixer.displayValue(channel) !== undefined ? 1 : 0.35 }}>
    <View pointerEvents="none" style={vertical
      ? { position: 'absolute', top: inset, bottom: inset, left: 34, width: 6, borderRadius: 3, backgroundColor: '#050A0D', justifyContent: 'flex-end' }
      : { position: 'absolute', left: inset, right: inset, top: 33, height: 6, borderRadius: 3, backgroundColor: '#050A0D' }}>
      <View style={vertical ? { height: (position * 100) + '%' as any, width: 6, borderRadius: 3, backgroundColor: color, opacity: 0.6 } : { width: (position * 100) + '%' as any, height: 6, borderRadius: 3, backgroundColor: color, opacity: 0.6 }} />
    </View>
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
      {Array.from({ length: 21 }, (_, index) => {
        const point = inset + travel * (vertical ? 1 - index / 20 : index / 20);
        return <View key={index} style={vertical
          ? { position: 'absolute', top: point, left: 23, width: index % 5 === 0 ? 9 : 5, height: 1, backgroundColor: theme.line }
          : { position: 'absolute', left: point, top: 49, width: 1, height: index % 5 === 0 ? 8 : 4, backgroundColor: theme.line }} />;
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
    <Animated.View {...responder.panHandlers} accessible accessibilityRole="adjustable" accessibilityLabel={label + (mix.parameter === 'pan' ? ' pan' : ' level')}
      accessibilityState={{ disabled: !ready }} accessibilityValue={{ min: 0, max: 100, now: Math.round(position * 100), text: levelText(session.mixer.displayValue(channel), mix.parameter) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]} onAccessibilityAction={event => {
        const token = session.mixer.beginDrag(channel); if (!token) return;
        session.mixer.drag(token, clamp(position + (event.nativeEvent.actionName === 'increment' ? 0.02 : -0.02))); session.mixer.flush(token);
        void Haptics.selectionAsync().catch(() => {});
      }}
      style={{ position: 'absolute', left: vertical ? 23 : 4, top: vertical ? 4 : 14,
        transform: vertical ? [{ translateY: thumb.interpolate({ inputRange: [0, 1], outputRange: [travel, 0] }) }] : [{ translateX: thumb.interpolate({ inputRange: [0, 1], outputRange: [0, travel] }) }],
        width: vertical ? 28 : 32, height: 44, borderRadius: 4,
        backgroundColor: '#18232B', borderWidth: 1, borderColor: dragging ? '#728893' : '#435560',
        shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 3, elevation: 4,
        alignItems: 'center', justifyContent: 'center' }}>
      <View pointerEvents="none" style={{ position: 'absolute', left: 2, right: 2, top: 1, height: 2, borderRadius: 1, backgroundColor: '#A5B8BF', opacity: 0.35 }} />
      <View pointerEvents="none" style={{ flexDirection: vertical ? 'column' : 'row', gap: 4 }}>
        {Array.from({ length: vertical ? 5 : 4 }, (_, index) => <View key={index} style={{ width: vertical ? 18 : 2, height: vertical ? 2 : 26, backgroundColor: '#03090C', borderRadius: 1 }}>
          <View style={{ flex: 1, backgroundColor: color, opacity: ready ? (index === 2 || dragging ? 1 : 0.65) : 0.25,
            borderRadius: 1, shadowColor: color, shadowOpacity: 0.9, shadowRadius: dragging ? 5 : 3, shadowOffset: { width: 0, height: 0 } }} />
        </View>)}
      </View>
    </Animated.View>
  </View>;
}
