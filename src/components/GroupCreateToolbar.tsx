import { Platform, Pressable, Text } from 'react-native';
import { Stack } from 'expo-router';

export default function GroupCreateToolbar({ creating, busy, canSave, save }: {
  creating: boolean; busy: boolean; canSave: boolean; save(): void;
}) {
  if (!creating) return null;
  const title = busy ? 'Creating…' : 'Create';
  if (Platform.OS === 'web') return <Stack.Screen options={{ headerRight: () =>
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canSave }} disabled={!canSave} onPress={save}
      style={{ minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', opacity: canSave ? 1 : 0.4 }}>
      <Text style={{ color: '#007AFF', fontSize: 17, fontWeight: '600' }}>{title}</Text>
    </Pressable> }} />;
  return <Stack.Toolbar placement="right">
    <Stack.Toolbar.Button tintColor="#007AFF" disabled={!canSave} accessibilityLabel={title} onPress={save}>{title}</Stack.Toolbar.Button>
  </Stack.Toolbar>;
}
