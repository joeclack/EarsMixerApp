import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenSurface from '../src/components/ScreenSurface';
import HardwarePanel from '../src/components/HardwarePanel';
import CloseButton from '../src/components/CloseButton';
import NativeButton from '../src/components/NativeButton';
import { Message } from '../src/components/ui';
import { useTheme } from '../src/theme';
import { useSession } from '../src/mixer/context';

// Shown when the connected mixer requires its connection PIN. The PIN is
// entered once; the mixer then recognises this device until its PIN changes
// or the device is signed out.
export default function Pin() {
  const { session, state } = useSession();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const closed = useRef(false);
  const revoked = useRef(!!state.pinPrompt?.revoked).current;
  const close = () => { if (!closed.current) { closed.current = true; Keyboard.dismiss(); router.back(); } };
  // Close once paired, or if the mixer was disconnected or changed meanwhile.
  useEffect(() => { if (!state.pinPrompt) close(); }, [state.pinPrompt]);
  async function submit(value = pin) {
    if (busy || value.length !== 6) return;
    setBusy(true); setError('');
    try { await session.pair(value); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not check the PIN. Try again.'); setPin(''); }
    finally { setBusy(false); }
  }
  const host = state.server ? new URL(state.server).host : 'the mixer';
  return <ScreenSurface><ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets
    contentContainerStyle={{ padding: 24, paddingTop: 32, paddingBottom: insets.bottom + 24 }}>
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 20 }}>
      <View style={{ flex: 1 }}>
        <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}>Enter connection PIN</Text>
        <Text style={{ color: theme.muted, fontSize: 15, marginTop: 6, lineHeight: 21 }}>
          {revoked ? 'This device was signed out of ' + host + '. Enter the current PIN to reconnect.'
            : host + ' needs a PIN. Ask the person running the mixer for the 6-digit code.'}
        </Text>
      </View>
      <CloseButton onPress={close} />
    </View>
    <HardwarePanel radius={18} style={{ paddingHorizontal: 16 }}>
      <TextInput accessibilityLabel="Connection PIN" value={pin} editable={!busy} autoFocus
        onChangeText={text => { const digits = text.replace(/\D/g, '').slice(0, 6); setPin(digits); setError(''); if (digits.length === 6) void submit(digits); }}
        keyboardType="number-pad" inputMode="numeric" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={6}
        placeholder="000000" placeholderTextColor={theme.muted} returnKeyType="done" onSubmitEditing={() => void submit()}
        style={{ position: 'relative', color: theme.text, fontSize: 32, fontWeight: '600', letterSpacing: 10, textAlign: 'center', minHeight: 64,
          paddingVertical: 12, fontVariant: ['tabular-nums'] }} />
    </HardwarePanel>
    <Message error>{error}</Message>
    <View style={{ gap: 10, marginTop: 14 }}>
      <NativeButton title={busy ? 'Checking…' : 'Connect'} prominent fullWidth disabled={busy || pin.length !== 6} onPress={() => void submit()} />
      <NativeButton title="Use a different mixer" bordered fullWidth disabled={busy} onPress={() => { closed.current = true; Keyboard.dismiss(); session.disconnect(); router.replace('/connect'); }} />
    </View>
  </ScrollView></ScreenSurface>;
}
