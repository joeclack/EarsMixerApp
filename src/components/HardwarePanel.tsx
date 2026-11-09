import { memo, type PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { hardwarePalette } from './hardwarePalette';

// Static inset housing for content, never a second skin on a native button.
export default memo(function HardwarePanel({ children, style, radius = 20 }: PropsWithChildren<{
  style?: StyleProp<ViewStyle>; radius?: number;
}>) {
  const { dark } = useTheme(), palette = hardwarePalette(dark);
  return <View style={[{ borderRadius: radius, overflow: 'hidden', backgroundColor: palette.surface }, style]}>
    <LinearGradient pointerEvents="none" colors={palette.gradient} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 1 }} style={StyleSheet.absoluteFill} />
    {children}
    <View pointerEvents="none" accessible={false} style={[StyleSheet.absoluteFill, {
      borderRadius: radius, borderWidth: 1, borderColor: palette.edge, borderBottomColor: palette.rim,
      boxShadow: [{ inset: true, offsetX: 0, offsetY: 2, blurRadius: 6, spreadDistance: 1, color: palette.shadow }],
    }]} />
  </View>;
});
