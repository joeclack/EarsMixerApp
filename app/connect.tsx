import React, { useState } from 'react';
import { Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../src/theme';
import { useSession } from '../src/mixer/context';
import { Glass, Icon, Message, Row } from '../src/components/ui';
import NativeButton from '../src/components/NativeButton';
export default function Connect() {
  const { session, state } = useSession();
  const theme = useTheme();
  const [address, setAddress] = useState(state.server || state.recent[0]?.url || '');
  const [error, setError] = useState('');
  async function connect(value = address) {
    if (state.connecting) return;
    Keyboard.dismiss(); setError('');
    try { await session.connect(value); router.back(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not connect.'); }
  }
  return <Glass collapsable={false} style={{ flex: 1, borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
    <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: 24, paddingTop: 32, paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}>Connect to mixer</Text>
          <Text style={{ color: theme.muted, fontSize: 15, marginTop: 6, lineHeight: 21 }}>Your mix is waiting on your network.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close connection sheet" onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.secondary, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={{ ios: 'xmark', android: 'close', web: 'close' }} size={14} color={theme.muted} />
        </Pressable>
      </View>
      <View style={{ backgroundColor: theme.panel, borderRadius: 18, paddingHorizontal: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Icon name={{ ios: 'network', android: 'wifi', web: 'wifi' }} color={theme.muted} />
        <TextInput testID="mixer-address" accessibilityLabel="Mixer address" value={address} onChangeText={setAddress} placeholder="192.168.1.100:8082" placeholderTextColor={theme.muted}
          autoCapitalize="none" autoCorrect={false} keyboardType="url" returnKeyType="go" editable={!state.connecting} onSubmitEditing={() => void connect()}
          style={{ flex: 1, color: theme.text, fontSize: 17, minHeight: 56, paddingVertical: 16 }} />
      </View>
      <Message error>{error}</Message>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 5, marginBottom: 24 }}>
        <NativeButton title={state.connecting ? 'Connecting…' : 'Connect'} symbol="wifi" prominent disabled={state.connecting || !address.trim()} onPress={() => void connect()} />
        <NativeButton title="Scan code" symbol="qrcode.viewfinder" disabled={state.connecting} onPress={() => router.push('/scan')} />
      </View>
      {!!state.recent.length && <>
        <Text style={{ color: theme.muted, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>RECENT MIXERS</Text>
        {state.recent.map(item => <View key={item.url} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}><Row title={new URL(item.url).host} detail={state.server === item.url ? 'Current mixer' : 'Tap to connect'} onPress={() => { if (!state.connecting) void connect(item.url); }} /></View>
          <Pressable accessibilityLabel={'Forget ' + new URL(item.url).host} accessibilityRole="button" disabled={state.connecting} onPress={() => void session.forget(item.url)}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name={{ ios: 'minus.circle', android: 'remove_circle_outline', web: 'remove_circle_outline' }} size={20} color={theme.muted} /></Pressable>
        </View>)}
      </>}
      <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 20, marginTop: 14 }}>Connect your phone to the same Wi-Fi network as your EarsMixer server. Find its address or QR code in the dashboard or tray.</Text>
    </ScrollView>
  </Glass>;
}
