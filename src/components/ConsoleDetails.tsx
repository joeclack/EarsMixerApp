import { memo, useEffect, type ReactNode } from 'react';
import { Platform, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

// Small console-hardware details drawn around native controls, never over them.
// All of them are decorative and hidden from assistive technologies.
const hidden = { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const, pointerEvents: 'none' as const };

export type LedColor = 'green' | 'amber' | 'red' | 'teal';
const ledColors: Record<LedColor, { lit: string; core: string }> = {
  green: { lit: '#30D158', core: '#C9FFD6' },
  amber: { lit: '#FFB020', core: '#FFF0C2' },
  red: { lit: '#FF453A', core: '#FFD3CF' },
  teal: { lit: '#26F5C6', core: '#D8FFF4' },
};

// A domed indicator lamp: a glowing lens when on, a dark glass lens when off.
export const Led = memo(function Led({ on = true, color = 'green', size = 8, pulse = false, style }: {
  on?: boolean; color?: LedColor; size?: number; pulse?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const { dark } = useTheme();
  const tone = ledColors[color];
  const glow = useSharedValue(1);
  useEffect(() => {
    if (!on || !pulse) { cancelAnimation(glow); glow.set(1); return; }
    glow.set(withRepeat(withTiming(0.35, { duration: 700, easing: Easing.inOut(Easing.quad), reduceMotion: ReduceMotion.System }), -1, true));
    return () => cancelAnimation(glow);
  }, [on, pulse, glow]);
  const animated = useAnimatedStyle(() => ({ opacity: glow.get() }));
  return <View {...hidden} style={[{ width: size + 4, height: size + 4, borderRadius: size, padding: 2,
    backgroundColor: dark ? '#05090C' : '#9FB0B8',
    boxShadow: [{ inset: true, offsetX: 0, offsetY: 1, blurRadius: 1, color: dark ? '#000000' : '#5F737C' },
      { offsetX: 0, offsetY: 1, blurRadius: 0, color: dark ? '#FFFFFF14' : '#FFFFFFCC' }] }, style]}>
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: dark ? '#1A262C' : '#3A4A51' }} />
    {on && <Animated.View style={[{ position: 'absolute', left: 2, top: 2, width: size, height: size, borderRadius: size / 2,
      backgroundColor: tone.lit, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: size, spreadDistance: 1, color: tone.lit + 'AA' }] }, animated]}>
      <View style={{ position: 'absolute', left: size * 0.22, top: size * 0.16, width: size * 0.38, height: size * 0.3,
        borderRadius: size, backgroundColor: tone.core, opacity: 0.85 }} />
    </Animated.View>}
  </View>;
});

// A recessed slotted screw head. The slot angle varies per screw like real hardware.
export const Screw = memo(function Screw({ size = 7, angle = 35, style }: { size?: number; angle?: number; style?: StyleProp<ViewStyle> }) {
  const { dark } = useTheme();
  return <View {...hidden} style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden',
    boxShadow: [{ offsetX: 0, offsetY: 0.5, blurRadius: 0.5, color: dark ? '#FFFFFF1A' : '#FFFFFFE6' },
      { offsetX: 0, offsetY: -0.5, blurRadius: 0.5, color: dark ? '#000000CC' : '#6E808866' }] }, style]}>
    <LinearGradient colors={dark ? ['#7D8F96', '#3A474D', '#1B2328'] : ['#F4F7F8', '#B9C6CC', '#8A9AA1']}
      start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
    <View style={{ position: 'absolute', left: size * 0.12, right: size * 0.12, top: size / 2 - 0.6, height: 1.2,
      backgroundColor: dark ? '#0B1215' : '#4E5F66', transform: [{ rotate: angle + 'deg' }] }} />
  </View>;
});

// Four screws pinned to the corners of a panel. The parent must be positioned.
export const CornerScrews = memo(function CornerScrews({ inset = 7, size = 6 }: { inset?: number; size?: number }) {
  return <>
    <Screw size={size} angle={30} style={{ position: 'absolute', left: inset, top: inset }} />
    <Screw size={size} angle={-55} style={{ position: 'absolute', right: inset, top: inset }} />
    <Screw size={size} angle={70} style={{ position: 'absolute', left: inset, bottom: inset }} />
    <Screw size={size} angle={-15} style={{ position: 'absolute', right: inset, bottom: inset }} />
  </>;
});

// Small-caps lettering stamped into the panel: a fine highlight on the lower lip
// in daylight, a shadow above it on graphite.
export function Engraved({ children, size = 11, color, style, ...props }: Omit<TextProps, 'style'> & {
  children: ReactNode; size?: number; color?: string; style?: StyleProp<TextStyle>;
}) {
  const { dark, muted } = useTheme();
  return <Text {...props} style={[{ color: color ?? muted, fontSize: size, lineHeight: Math.round(size * 1.3), fontWeight: '700',
    letterSpacing: size * 0.12, textTransform: 'uppercase',
    textShadowColor: dark ? '#000000B3' : '#FFFFFFE6', textShadowOffset: { width: 0, height: dark ? -0.5 : 1 }, textShadowRadius: 0 }, style]}>
    {children}
  </Text>;
}

// A machined seam: a dark groove with a bright lip beneath it.
export function PanelSeam({ style }: { style?: StyleProp<ViewStyle> }) {
  const { dark } = useTheme();
  return <View {...hidden} style={[{ height: 2, alignSelf: 'stretch' }, style]}>
    <View style={{ height: 1, backgroundColor: dark ? '#00000099' : '#AFC0C866' }} />
    <View style={{ height: 1, backgroundColor: dark ? '#FFFFFF0F' : '#FFFFFFCC' }} />
  </View>;
}

// A section heading with an engraved label and a seam running to the edge.
export function PanelHeading({ title, trailing }: { title: string; trailing?: ReactNode }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 28 }}>
    <Engraved accessibilityRole="header">{title}</Engraved>
    <PanelSeam style={{ flex: 1, alignSelf: 'center' }} />
    {trailing}
  </View>;
}

// A tiny backlit LCD chip for numeric readouts, matching the landscape displays.
export function LcdReadout({ children, minWidth = 62 }: { children: ReactNode; minWidth?: number }) {
  return <View style={{ minWidth, borderRadius: 5, padding: 2, backgroundColor: '#071921', borderWidth: 1, borderColor: '#497886' }}>
    <View style={{ borderRadius: 3, paddingHorizontal: 6, paddingVertical: 1.5, backgroundColor: '#81E9E5', borderWidth: 1, borderColor: '#ADFFEF',
      boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 6, color: '#2DE8F133' }] }}>
      <Text numberOfLines={1} style={{ color: '#07343D', fontSize: 12, lineHeight: 15, fontWeight: '700', textAlign: 'right', fontVariant: ['tabular-nums'],
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>{children}</Text>
    </View>
  </View>;
}
