import type { ReactNode } from 'react';
import { Platform, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';

// Small console-hardware details drawn around native controls, never over them.
// All of them are decorative and hidden from assistive technologies.
const hidden = { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const, pointerEvents: 'none' as const };

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

// A recessed numbered key for ordered instructions.
export function StepNumber({ value }: { value: number }) {
  const { dark, tint } = useTheme();
  return <View {...hidden} style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    backgroundColor: dark ? '#0B151B' : '#FFFFFF', borderWidth: 1, borderColor: dark ? '#30434D' : '#BCCCD5',
    boxShadow: [{ inset: true, offsetX: 0, offsetY: 1, blurRadius: 3, color: dark ? '#00000099' : '#24414E1F' }] }}>
    <Text style={{ color: tint, fontSize: 13, lineHeight: 16, fontWeight: '700', fontVariant: ['tabular-nums'],
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>{value}</Text>
  </View>;
}
