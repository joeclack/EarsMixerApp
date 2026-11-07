import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { clamp, levelText } from '../mixer/model';
import type { DragToken } from '../mixer/client';

export default function Fader({ channel, label, color }: { channel: number; label: string; color: string }) {
  const { session, state, mix } = useSession();
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const latest = useRef({ width, state, mix });
  latest.current = { width, state, mix };
  const drag = useRef<{ token: DragToken; start: number; moved: boolean } | null>(null);
  const cancel = () => {
    if (drag.current) session.mixer.cancelDrag(drag.current.token);
    drag.current = null; setDragging(false);
  };
  useEffect(() => { cancel(); }, [mix.epoch, width]);
  useEffect(() => () => { if (drag.current) session.mixer.cancelDrag(drag.current.token); }, [session]);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => latest.current.mix.status === 'connected' && latest.current.mix.values[channel] !== undefined,
    onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 3,
    onPanResponderGrant: () => {
      const token = session.mixer.beginDrag(channel);
      if (!token) return;
      drag.current = { token, start: session.mixer.position(channel), moved: false };
    },
    onPanResponderMove: (_event, gesture) => {
      const current = drag.current;
      if (!current || current.token.epoch !== session.mixer.state.epoch || latest.current.width <= 32) return;
      if (!current.moved && Math.abs(gesture.dy) > Math.abs(gesture.dx) + 5) { cancel(); return; }
      if (!current.moved && Math.abs(gesture.dx) < 3) return;
      if (!current.moved) {
        current.moved = true; setDragging(true);
        if (latest.current.state.settings.haptics) void Haptics.selectionAsync().catch(() => {});
      }
      session.mixer.drag(current.token, clamp(current.start + gesture.dx / (latest.current.width - 32)));
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
  return <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ height: 48, justifyContent: 'center', opacity: ready ? 1 : 0.35 }}>
    <View pointerEvents="none" style={{ height: 6, borderRadius: 4, marginHorizontal: 16, backgroundColor: theme.secondary }}>
      <View style={{ width: (position * 100) + '%' as any, height: 6, borderRadius: 4, backgroundColor: color }} />
    </View>
    <View {...responder.panHandlers} accessible accessibilityRole="adjustable" accessibilityLabel={label + (mix.parameter === 'pan' ? ' pan' : ' level')}
      accessibilityState={{ disabled: !ready }} accessibilityValue={{ min: 0, max: 100, now: Math.round(position * 100), text: levelText(mix.values[channel], mix.parameter) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]} onAccessibilityAction={event => {
        const token = session.mixer.beginDrag(channel); if (!token) return;
        session.mixer.drag(token, clamp(position + (event.nativeEvent.actionName === 'increment' ? 0.02 : -0.02))); session.mixer.flush(token);
      }}
      style={{ position: 'absolute', left: Math.max(0, width - 32) * position, width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#FFFFFF', borderWidth: 0.5, borderColor: '#00000012',
        shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: dragging ? 0.24 : 0.15, shadowRadius: dragging ? 7 : 3, elevation: 3,
        transform: [{ scale: dragging ? 1.12 : 1 }] }} />
  </View>;
}
