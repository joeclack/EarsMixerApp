import { memo, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

// The dark channel recess and the lower rim reflection match the icon hardware.
// These static surfaces are separate from the animated track and grip.
export default memo(function FaderHousing({ vertical, children, size = 1 }: PropsWithChildren<{ vertical: boolean; size?: number }>) {
  const theme = useTheme();
  const radius = vertical ? 44 * size : 999;
  // Landscape strips sit 6 pt apart inside groups, so their collar is narrower.
  const bevel = vertical && size === 1 ? 3 : 7;
  return <View style={{ alignSelf: vertical ? 'center' : 'stretch', width: vertical ? 88 * size : undefined }}>
    <FaderBevel dark={theme.dark} width={bevel} radius={vertical ? radius : 999} />
    <Housing vertical={vertical} radius={radius}>{children}</Housing>
  </View>;
});

// A raised collar of background material that rises softly around the pill,
// lit from above, so the housing reads as pressed up out of the surface.
// It sits outside the housing's bounds and never affects layout or touches.
function FaderBevel({ dark, width, radius }: { dark: boolean; width: number; radius: number }) {
  return <View pointerEvents="none" accessible={false} style={{ position: 'absolute', inset: -width,
    borderRadius: radius === 999 ? 999 : radius + width,
    boxShadow: dark
      ? [{ offsetX: 0, offsetY: -2, blurRadius: 6, color: '#FFFFFF0D' },
        { offsetX: 0, offsetY: 5, blurRadius: 12, spreadDistance: 1, color: '#00000073' }]
      : [{ offsetX: 0, offsetY: -3, blurRadius: 8, color: '#FFFFFFE6' },
        { offsetX: 0, offsetY: 5, blurRadius: 12, spreadDistance: 1, color: '#2E4A5826' }] }}>
    <LinearGradient colors={dark ? ['#2A3B44', '#16232A', '#0A1217'] : ['#FBFDFE', '#E6EDF1', '#CCD8DF']}
      locations={[0, 0.5, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
      style={[StyleSheet.absoluteFill, { borderRadius: radius === 999 ? 999 : radius + width }]} />
    <View style={[StyleSheet.absoluteFill, { borderRadius: radius === 999 ? 999 : radius + width,
      boxShadow: dark
        ? [{ inset: true, offsetX: 0, offsetY: 1, blurRadius: 2, color: '#FFFFFF14' }]
        : [{ inset: true, offsetX: 0, offsetY: 1, blurRadius: 2, color: '#FFFFFF' },
          { inset: true, offsetX: 0, offsetY: -1, blurRadius: 3, color: '#2E4A581A' }] }]} />
  </View>;
}

function Housing({ vertical, radius, children }: PropsWithChildren<{ vertical: boolean; radius: number }>) {
  const theme = useTheme();
  if (!theme.dark) return <View style={{ alignSelf: 'stretch',
    borderRadius: radius, paddingHorizontal: vertical ? 2 : 16, paddingVertical: vertical ? 10 : 4,
    backgroundColor: theme.consoleFace, borderWidth: 2, borderColor: theme.consoleRed,
    boxShadow: [{ offsetX: 0, offsetY: 2, blurRadius: 3, color: '#5A422D26' }] }}>
    <LinearGradient pointerEvents="none" colors={theme.consoleGradient} locations={[0, 0.3, 1]}
      start={vertical ? { x: 0, y: 0.5 } : { x: 0.5, y: 0 }} end={vertical ? { x: 1, y: 0.5 } : { x: 0.5, y: 1 }}
      style={[StyleSheet.absoluteFill, { borderRadius: vertical ? radius - 2 : radius }]} />
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: vertical ? radius - 2 : radius,
      boxShadow: [{ inset: true, offsetX: 2, offsetY: 3, blurRadius: 8, spreadDistance: 1, color: theme.consoleShadow },
        { inset: true, offsetX: -1, offsetY: -2, blurRadius: 2, color: '#FFFFFFAA' }] }]} />
    <View pointerEvents="none" style={{ position: 'absolute', inset: 2, borderRadius: vertical ? radius - 4 : radius, borderWidth: 1, borderColor: theme.consoleRim }} />
    {children}
  </View>;
  return <View style={{ alignSelf: 'stretch',
    borderRadius: 999, backgroundColor: '#061014', overflow: 'hidden',
    borderWidth: vertical ? 2 : 0, borderColor: '#061014', paddingHorizontal: vertical ? 2 : 16, paddingVertical: vertical ? 10 : 4 }}>
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
}
