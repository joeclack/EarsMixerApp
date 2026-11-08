import { useCallback } from 'react';
import { router, Stack, useFocusEffect } from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSession } from '../src/mixer/context';
import { useTheme } from '../src/theme';
import ChannelOrder from '../src/components/ChannelOrder';
export default function LayoutEditor() {
  const { session } = useSession(), theme = useTheme();
  useFocusEffect(useCallback(() => { session.mixer.cancelWrites(); }, [session]));
  return <View style={{ flex: 1, backgroundColor: theme.bg }}>
    {Platform.OS === 'web' ? <Stack.Screen options={{ headerRight: () =>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ padding: 12 }}>
        <Text style={{ color: theme.tint, fontSize: 17 }}>Done</Text>
      </Pressable> }} /> :
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button variant="done" accessibilityLabel="Done" onPress={() => router.back()}>Done</Stack.Toolbar.Button>
      </Stack.Toolbar>}

    <ChannelOrder />
  </View>;
}
