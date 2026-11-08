import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

// Static layers sit behind each screen, including its transparent header.
// The grain repeats at its natural size so it stays fine in either orientation.
export default memo(function AppBackground() {
  const { dark } = useTheme();
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
    <LinearGradient colors={dark ? ['#1B2931', '#121C23', '#0A1015'] : ['#E1E7E7', '#EEF1F0', '#E0E6E6']}
      locations={[0, 0.45, 1]} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={StyleSheet.absoluteFill} />
    <LinearGradient colors={dark ? ['rgba(72,216,196,0.055)', 'rgba(72,216,196,0)'] : ['rgba(0,125,113,0.035)', 'rgba(0,125,113,0)']}
      start={{ x: 0, y: 0 }} end={{ x: 0.65, y: 0.45 }} style={StyleSheet.absoluteFill} />
    <Image source={require('../../assets/textures/console-grain.png')} resizeMode="repeat" fadeDuration={0}
      style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: dark ? 0.16 : 0.1 }]} />
    <LinearGradient colors={dark
      ? ['rgba(0,0,0,0.18)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.24)']
      : ['rgba(20,40,45,0.06)', 'rgba(20,40,45,0)', 'rgba(20,40,45,0)', 'rgba(20,40,45,0.08)']}
      locations={[0, 0.18, 0.82, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
  </View>;
});
