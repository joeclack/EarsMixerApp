import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { clamp, levelText } from '../mixer/model';
import type { DragToken } from '../mixer/client';

export default function Fader({ channel, label, color, vertical = false, length = 200 }: { channel: number; label: string; color: string; vertical?: boolean; length?: number }) {
  const { session, mix } = useSession();
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
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
      if (!current || current.token.epoch !== session.mixer.state.epoch || latest.current.width <= 32) return;
      const movement = latest.current.vertical ? -gesture.dy : gesture.dx;
      const cross = latest.current.vertical ? gesture.dx : gesture.dy;
      if (!current.moved && Math.abs(cross) > Math.abs(movement) + 5) { cancel(); return; }
      if (!current.moved && Math.abs(movement) < 3) return;
      if (!current.moved) {
        current.moved = true; setDragging(true);
      }
      const travel = latest.current.width - 32;
      const position = clamp(current.start + movement / travel);
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
  return <View onLayout={event => setWidth(vertical ? event.nativeEvent.layout.height : event.nativeEvent.layout.width)} style={{ height: vertical ? length : 48, width: vertical ? 56 : undefined, alignSelf: vertical ? 'center' : undefined, justifyContent: 'center', opacity: session.mixer.displayValue(channel) !== undefined ? 1 : 0.35 }}>
    {vertical && <View pointerEvents="none" style={{ position: 'absolute', top: 16, bottom: 16, left: 0, right: 0, justifyContent: 'space-between' }}>
      {Array.from({ length: 9 }, (_, index) => <View key={index} style={{ height: 1, width: index % 2 ? 8 : 14, backgroundColor: theme.line }} />)}
    </View>}
    <View pointerEvents="none" style={vertical ? { position: 'absolute', top: 16, bottom: 16, width: 6, left: 25, borderRadius: 4, backgroundColor: theme.secondary, justifyContent: 'flex-end' } : { height: 6, borderRadius: 4, marginHorizontal: 16, backgroundColor: theme.secondary }}>
      <View style={vertical ? { height: (position * 100) + '%' as any, width: 6, borderRadius: 4, backgroundColor: color } : { width: (position * 100) + '%' as any, height: 6, borderRadius: 4, backgroundColor: color }} />
    </View>
    <View {...responder.panHandlers} accessible accessibilityRole="adjustable" accessibilityLabel={label + (mix.parameter === 'pan' ? ' pan' : ' level')}
      accessibilityState={{ disabled: !ready }} accessibilityValue={{ min: 0, max: 100, now: Math.round(position * 100), text: levelText(session.mixer.displayValue(channel), mix.parameter) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]} onAccessibilityAction={event => {
        const token = session.mixer.beginDrag(channel); if (!token) return;
        session.mixer.drag(token, clamp(position + (event.nativeEvent.actionName === 'increment' ? 0.02 : -0.02))); session.mixer.flush(token);
        void Haptics.selectionAsync().catch(() => {});
      }}
      style={{ position: 'absolute', left: vertical ? 9 : Math.max(0, width - 32) * position, top: vertical ? Math.max(0, width - 32) * (1 - position) : undefined, width: 32, height: 32, borderRadius: vertical ? 6 : 16,
        backgroundColor: '#FFFFFF', borderWidth: 0.5, borderColor: '#00000012',
        shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: dragging ? 0.24 : 0.15, shadowRadius: dragging ? 7 : 3, elevation: 3,
        transform: [{ scale: dragging ? 1.12 : 1 }] }} />
  </View>;
}
