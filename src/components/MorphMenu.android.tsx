import { useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions, type HostInstance } from 'react-native';
import Animated, { Easing, ReduceMotion, interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { Icon } from './ui';

export type MorphMenuItem = { id: string | number; label: string; onPress(): void; selected?: boolean; disabled?: boolean; destructive?: boolean };
type Rect = { x: number; y: number; width: number; height: number };

const ITEM_HEIGHT = 48, PADDING = 6, MIN_WIDTH = 220, EDGE = 12;
const TIMING = { duration: 240, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System };

// A toolbar pill that grows into its own menu. The pill's face stays at the
// top of the panel, the panel widens and drops to fit the options, and
// closing shrinks it back into the pill. It opens towards the side of the
// screen with room, and upwards when there's no room below.
export default function MorphMenu({ label, title, face, background, panelBackground, disabled, items, style }: {
  label: string; title?: string; face(open: boolean): ReactNode; background: string; panelBackground: string;
  disabled?: boolean; items: MorphMenuItem[]; style: object;
}) {
  const theme = useTheme();
  const window = useWindowDimensions(), insets = useSafeAreaInsets();
  const trigger = useRef<HostInstance>(null);
  const [from, setFrom] = useState<Rect | null>(null);
  // While shrinking back, the face shows the pill's closed look (with the new choice).
  const [closing, setClosing] = useState(false);
  const progress = useSharedValue(0);
  // Only choice menus (Level or Pan) reserve room for a check mark.
  const checks = items.some(item => item.selected !== undefined);

  const open = () => trigger.current?.measureInWindow((x, y, width, height) => {
    setFrom({ x, y, width, height }); setClosing(false);
    progress.set(0);
    progress.set(withTiming(1, TIMING));
  });
  const close = (then?: () => void) => {
    setClosing(true);
    progress.set(withTiming(0, TIMING, finished => {
      if (!finished) return;
      scheduleOnRN(setFrom, null);
      if (then) scheduleOnRN(then);
    }));
  };

  const width = from ? Math.min(window.width - EDGE * 2, Math.max(MIN_WIDTH, from.width)) : 0;
  const height = from ? from.height + PADDING + items.length * ITEM_HEIGHT + PADDING : 0;
  const alignRight = !!from && from.x + from.width / 2 > window.width / 2;
  const left = !from ? 0 : Math.min(window.width - EDGE - width, Math.max(EDGE,
    alignRight ? from.x + from.width - width : from.x));
  const upwards = !!from && from.y + height > window.height - insets.bottom - EDGE && from.y + from.height - height > insets.top + EDGE;
  const top = !from ? 0 : upwards ? from.y + from.height - height : from.y;

  const panel = useAnimatedStyle(() => {
    if (!from) return {};
    const p = progress.get();
    return {
      left: interpolate(p, [0, 1], [from.x, left]), top: interpolate(p, [0, 1], [from.y, top]),
      width: interpolate(p, [0, 1], [from.width, width]), height: interpolate(p, [0, 1], [from.height, height]),
      borderRadius: interpolate(p, [0, 1], [from.height / 2, 24]),
      backgroundColor: interpolateColor(p, [0, 1], [background, panelBackground]),
      elevation: interpolate(p, [0, 1], [0, 8]),
    };
  });
  const faceStyle = useAnimatedStyle(() => ({
    // The face keeps its place while the panel grows around it.
    transform: [{ translateX: from ? interpolate(progress.get(), [0, 1], [0, alignRight ? width - from.width : 0]) : 0 }],
  }));
  const list = useAnimatedStyle(() => ({ opacity: interpolate(progress.get(), [0.35, 1], [0, 1], 'clamp') }));

  return <>
    <Pressable android_disableSound ref={trigger} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, expanded: !!from }}
      disabled={disabled} onPress={open} style={[style, { backgroundColor: background, opacity: from ? 0 : 1 }]}>
      {face(false)}
    </Pressable>
    {from && <Modal transparent visible animationType="none" onRequestClose={() => close()}>
      {/* Tapping anywhere else closes it; like Material menus, the screen isn't dimmed. */}
      <Pressable android_disableSound accessibilityLabel="Close menu" style={{ position: 'absolute', inset: 0 }} onPress={() => close()} />
      <Animated.View accessibilityViewIsModal style={[{ position: 'absolute', overflow: 'hidden' }, panel]}>
        <Animated.View style={[{ width: from.width, height: from.height }, upwards && { position: 'absolute', bottom: 0 }, faceStyle]}>
          <Pressable android_disableSound accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ expanded: true }} onPress={() => close()}
            style={[style, { backgroundColor: 'transparent' }]}>{face(!closing)}</Pressable>
        </Animated.View>
        {!!title && <Animated.View pointerEvents="none" style={[{ position: 'absolute', height: from.height, justifyContent: 'center',
          paddingHorizontal: 20 }, alignRight ? { left: 0 } : { right: 0 }, upwards ? { bottom: 0 } : { top: 0 }, list]}>
          <Text accessibilityRole="header" numberOfLines={1} style={{ color: theme.muted, fontSize: 13, fontWeight: '700',
            letterSpacing: 1, textTransform: 'uppercase' }}>{title}</Text>
        </Animated.View>}
        <Animated.View accessibilityRole="menu" style={[{ position: 'absolute', left: PADDING, right: PADDING, minWidth: width - PADDING * 2 },
          upwards ? { top: PADDING } : { top: from.height + PADDING }, list]}>
          {items.map(item => <Pressable android_disableSound key={item.id} accessibilityRole="menuitem" disabled={item.disabled}
            accessibilityState={{ disabled: item.disabled, selected: item.selected }}
            onPress={() => {
              // A choice (Level or Pan) applies at once so the pill shows it as the menu shrinks
              // back; actions that open another screen wait until the menu has gone.
              if (item.selected !== undefined) { item.onPress(); close(); } else close(item.onPress);
            }} android_ripple={{ color: theme.line, borderless: false }}
            style={{ height: ITEM_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, borderRadius: 18, overflow: 'hidden',
              backgroundColor: item.selected ? theme.tint + '26' : 'transparent' }}>
            {checks && <View style={{ width: 20, alignItems: 'center' }}>{item.selected && <Icon name={{ android: 'check' }} size={20} color={theme.tint} />}</View>}
            <Text numberOfLines={1} style={{ flex: 1, fontSize: 16, fontWeight: item.selected ? '700' : '500',
              color: item.disabled ? theme.muted : item.destructive ? theme.danger : theme.text }}>{item.label}</Text>
          </Pressable>)}
        </Animated.View>
      </Animated.View>
    </Modal>}
  </>;
}
