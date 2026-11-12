import React, { useState } from 'react';
import { Keyboard, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenSurface from '../src/components/ScreenSurface';
import HardwarePanel from '../src/components/HardwarePanel';
import NativeButton from '../src/components/NativeButton';
import { useTheme } from '../src/theme';
import { useSession } from '../src/mixer/context';

// Shown once on launch to devices set up before a nickname was required. It
// cannot be dismissed; the app connects after the nickname is saved.
export default function Nickname() {
  const { session } = useSession();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const save = () => {
    if (!name.trim()) return;
    Keyboard.dismiss();
    session.setSettings({ nickname: name });
    router.back();
  };
  return <ScreenSurface><ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets
    contentContainerStyle={{ padding: 24, paddingTop: 32, paddingBottom: insets.bottom + 24 }}>
    <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}>Add your nickname</Text>
    <Text style={{ color: theme.muted, fontSize: 15, marginTop: 6, marginBottom: 20, lineHeight: 21 }}>
      This name identifies your connection to the mixer. Others on your mix see it.
    </Text>
    <HardwarePanel radius={18} style={{ paddingHorizontal: 16 }}>
      <TextInput accessibilityLabel="Nickname" value={name} onChangeText={setName} autoFocus maxLength={80}
        placeholder="Nickname" placeholderTextColor={theme.muted} autoComplete="name" autoCapitalize="words" autoCorrect={false}
        returnKeyType="done" onSubmitEditing={save}
        style={{ position: 'relative', color: theme.text, fontSize: 20, minHeight: 56, paddingVertical: 14 }} />
    </HardwarePanel>
    <View style={{ marginTop: 14 }}>
      <NativeButton title="Continue" prominent fullWidth disabled={!name.trim()} onPress={save} />
    </View>
  </ScrollView></ScreenSurface>;
}
