import { memo, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

// The dark channel recess and the lower rim reflection match the icon hardware.
// These static surfaces are separate from the animated track and grip.
export default memo(function FaderHousing({ vertical, children, size = 1 }: PropsWithChildren<{ vertical: boolean; size?: number }>) {
  const theme = useTheme();
  const radius = vertical ? 44 * size : 999;
  return <View style={{ alignSelf: vertical ? 'center' : 'stretch', width: vertical ? 88 * size : undefined }}>
    <FaderRise dark={theme.dark} radius={radius} />
    <Housing vertical={vertical} radius={radius}>{children}</Housing>
  </View>;
});

// Soft light above and shade below, outside the pill, with no shape of its own.
// It never affects layout or touches.
function FaderRise({ dark, radius }: { dark: boolean; radius: number }) {
  return <View pointerEvents="none" accessible={false} style={{ position: 'absolute', inset: 0, borderRadius: radius,
    boxShadow: dark
      ? [{ offsetX: 0, offsetY: -3, blurRadius: 8, color: 'rgba(160,200,215,0.06)' },
        { offsetX: 0, offsetY: 3, blurRadius: 10, color: 'rgba(0,0,0,0.25)' }]
      : [{ offsetX: 0, offsetY: -3, blurRadius: 8, color: 'rgba(255,255,255,0.5)' },
        { offsetX: 0, offsetY: 3, blurRadius: 10, color: 'rgba(46,74,88,0.09)' }] }} />;
}

// The pill's outermost band is translucent, so the real page shows through it,
// lit from above like a surface curving up. The fader face sits inside it, so
// the pill's silhouette is the page itself rather than an edge of its own.
const BEZEL = 3;

function Housing({ vertical, radius, children }: PropsWithChildren<{ vertical: boolean; radius: number }>) {
  const theme = useTheme();
  const face = radius === 999 ? 999 : radius - BEZEL;
  return <View style={{ alignSelf: 'stretch', borderRadius: radius, paddingHorizontal: vertical ? 2 : 16, paddingVertical: vertical ? 10 : 4 }}>
    <LinearGradient pointerEvents="none" colors={theme.dark
      ? ['rgba(160,200,215,0.10)', 'rgba(160,200,215,0.02)', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.35)']
      : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.15)', 'rgba(46,74,88,0.03)', 'rgba(46,74,88,0.12)']}
      locations={[0, 0.35, 0.6, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
      style={[StyleSheet.absoluteFill, { borderRadius: radius }]} />
    {theme.dark ? <View pointerEvents="none" style={{ position: 'absolute', inset: BEZEL, borderRadius: face, overflow: 'hidden', backgroundColor: '#0B171C' }}>
      <LinearGradient colors={['#030B0E', '#0B171C', '#122127']} locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }} end={{ x: 0.85, y: 1 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.18)']}
        locations={[0, 0.42, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { borderRadius: face,
        boxShadow: [{ offsetX: 2, offsetY: 3, blurRadius: 9, spreadDistance: 2, color: '#000000A0', inset: true }] }]} />
    </View> : <View pointerEvents="none" style={{ position: 'absolute', inset: BEZEL, borderRadius: face, overflow: 'hidden',
      backgroundColor: theme.consoleFace }}>
      <LinearGradient colors={theme.consoleGradient} locations={[0, 0.3, 1]}
        start={vertical ? { x: 0, y: 0.5 } : { x: 0.5, y: 0 }} end={vertical ? { x: 1, y: 0.5 } : { x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { borderRadius: face,
        // The face curves down from the bezel with soft shading and no edge line.
        boxShadow: [{ inset: true, offsetX: 0, offsetY: 2, blurRadius: 4, color: 'rgba(90,66,45,0.35)' },
          { inset: true, offsetX: 0, offsetY: -2, blurRadius: 3, color: 'rgba(255,255,255,0.5)' },
          { inset: true, offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: 'rgba(90,66,45,0.12)' }] }]} />
      {/* The console red, inlaid as a fine pinstripe inside the face. */}
      <View style={{ position: 'absolute', inset: 3, borderRadius: face === 999 ? 999 : face - 3, borderWidth: 1, borderColor: 'rgba(180,43,67,0.75)' }} />
    </View>}
    {children}
  </View>;
}
