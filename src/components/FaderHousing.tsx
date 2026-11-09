import { memo, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

// The dark channel recess and the lower rim reflection match the icon hardware.
// These static surfaces are separate from the animated track and grip.
export default memo(function FaderHousing({ vertical, children }: PropsWithChildren<{ vertical: boolean }>) {
  const theme = useTheme();
  if (vertical || !theme.dark) return <View style={{ alignSelf: vertical ? 'center' : 'stretch', width: vertical ? 88 : undefined,
    borderRadius: vertical ? 38 : 999, paddingHorizontal: vertical ? 2 : 16, paddingVertical: vertical ? 10 : 4,
    backgroundColor: theme.consoleFace, borderWidth: 2, borderColor: theme.consoleRed }}>
    <LinearGradient pointerEvents="none" colors={theme.consoleGradient} locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.1 }} style={[StyleSheet.absoluteFill, { borderRadius: 36 }]} />
    <View pointerEvents="none" style={{ position: 'absolute', inset: 2, borderRadius: vertical ? 34 : 999, borderWidth: 1, borderColor: theme.consoleRim }} />
    {children}
  </View>;
  return <View style={{ alignSelf: vertical ? 'center' : 'stretch', width: vertical ? 64 : undefined,
    borderRadius: 999, backgroundColor: '#061014', overflow: 'hidden',
    paddingHorizontal: vertical ? 0 : 16, paddingVertical: vertical ? 12 : 4 }}>
    <LinearGradient pointerEvents="none" colors={['#02090C', '#16272E', '#526A74']}
      locations={[0, 0.55, 1]} start={{ x: 0.15, y: 0 }} end={{ x: 0.8, y: 1 }}
      style={[StyleSheet.absoluteFill, { borderRadius: 999 }]} />
    <View pointerEvents="none" style={{ position: 'absolute', top: 1, bottom: 1.5, left: 1.3, right: 1.3,
      borderRadius: 999, overflow: 'hidden', backgroundColor: '#0B171C' }}>
      <LinearGradient colors={['#030B0E', '#0B171C', '#122127']} locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }} end={{ x: 0.85, y: 1 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.18)']}
        locations={[0, 0.42, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { borderRadius: 999,
        boxShadow: [{ offsetX: 2, offsetY: 3, blurRadius: 9, spreadDistance: 2, color: '#000000A0', inset: true }] }]} />
    </View>
    {children}
  </View>;
});
