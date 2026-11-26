import { Stack } from 'expo-router';
import { Text, View, useWindowDimensions } from 'react-native';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { MixerAuxMenu, MixerModeMenu, MixerToolsMenu } from './MixerControls.android';

export default function MixerToolbar() {
  const { state } = useSession();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  return <Stack.Screen options={{
    headerLeft: () => state.server ? <MixerAuxMenu maxWidth={Math.max(96, Math.min(320, width - 176))} />
      : <Text accessibilityRole="header" style={{ color: theme.text, fontWeight: '600', fontSize: 20 }}>Mixer</Text>,
    headerRight: () => state.server ? <View style={{ flexDirection: 'row', alignItems: 'center' }}><MixerModeMenu /><MixerToolsMenu /></View> : null,
  }} />;
}
