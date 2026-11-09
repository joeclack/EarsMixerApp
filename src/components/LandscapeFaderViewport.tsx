import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

export default function LandscapeFaderViewport({ enabled, children }: PropsWithChildren<{ enabled: boolean }>) {
  if (!enabled) return <View style={{ flex: 1 }}>{children}</View>;
  // Fade the faders themselves, revealing the same background as the rail.
  return <MaskedView style={{ flex: 1 }} maskElement={<View style={{ flex: 1, flexDirection: 'row' }}>
    <LinearGradient colors={['transparent', '#000000']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: 16 }} />
    <View style={{ flex: 1, backgroundColor: '#000000' }} />
    <LinearGradient colors={['#000000', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: 16 }} />
  </View>}>{children}</MaskedView>;
}
