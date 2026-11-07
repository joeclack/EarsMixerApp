import { useCallback } from 'react';
import { router, Stack, useFocusEffect } from 'expo-router';
import { View } from 'react-native';
import { useSession } from '../src/mixer/context';
import { useTheme } from '../src/theme';
import NativeButton from '../src/components/NativeButton';
import ChannelOrder from '../src/components/ChannelOrder';
export default function LayoutEditor() {
  const { session } = useSession(), theme = useTheme();
  useFocusEffect(useCallback(() => { session.mixer.cancelWrites(); }, [session]));
  return <View style={{ flex: 1, backgroundColor: theme.bg }}>
    <Stack.Screen options={{ headerRight: () => <NativeButton title="Done" onPress={() => router.back()} /> }} />
    <ChannelOrder />
  </View>;
}
