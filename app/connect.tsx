import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme';
import { useSession } from '../src/mixer/context';
import { Icon, Message, Row } from '../src/components/ui';
import CloseButton from '../src/components/CloseButton';
import NativeButton from '../src/components/NativeButton';
import Segmented from '../src/components/Segmented';
import { useNearbyMixers } from '../src/discovery/useNearbyMixers';
import { reachableMixer, type NearbyMixer } from '../src/discovery/browser';
export default function Connect() {
  const { session, state } = useSession();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [address, setAddress] = useState(state.server || state.recent[0]?.url || '');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('auto');
  const nearby = useNearbyMixers();
  const [resolving, setResolving] = useState(false);
  const pending = useRef<AbortController | null>(null);
  const busy = resolving || state.connecting;
  useEffect(() => () => pending.current?.abort(), []);
  async function connectNearby(mixer: NearbyMixer) {
    if (busy || pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setResolving(true); setError(''); Keyboard.dismiss();
    try {
      const url = await reachableMixer(mixer, controller.signal);
      if (!controller.signal.aborted) { setAddress(url); await connect(url); }
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not connect.');
    } finally {
      pending.current = null;
      if (!controller.signal.aborted) setResolving(false);
    }
  }
  async function connect(value = address) {
    if (state.connecting) return;
    Keyboard.dismiss(); setError('');
    try { await session.connect(value); router.back(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not connect.'); }
  }
  return <View style={{ flex: 1, minHeight: 0, backgroundColor: 'transparent' }}>
    <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: 24, paddingTop: 32, paddingBottom: Math.max(insets.bottom, 12) + 24 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}>Connect to mixer</Text>
          <Text style={{ color: theme.muted, fontSize: 15, marginTop: 6, lineHeight: 21 }}>Select a server or enter its address.</Text>
        </View>
        <CloseButton onPress={() => router.back()} />
      </View>
      <View style={{ marginBottom: 24 }}>
        <Segmented label="Connection method" value={mode} options={[{ value: 'auto', label: 'Auto' }, { value: 'manual', label: 'Manual' }]}
          onChange={value => { if (!busy) { Keyboard.dismiss(); setError(''); setMode(value); } }} />
      </View>
      {mode === 'auto' ? <View style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text accessibilityRole="header" style={{ color: theme.muted, fontSize: 13, fontWeight: '600' }}>NEARBY MIXERS</Text>
          {nearby.status === 'searching' ? <ActivityIndicator accessibilityLabel="Searching for nearby mixers" color={theme.tint} /> :
            nearby.status !== 'unavailable' && <Pressable accessibilityRole="button" disabled={busy} onPress={nearby.retry} hitSlop={10}>
              <Text style={{ color: theme.tint, fontSize: 15 }}>Search again</Text>
            </Pressable>}
        </View>
        {nearby.mixers.map(mixer => <Row key={mixer.id} title={mixer.name} detail={new URL(mixer.urls[0]).host}
          onPress={() => { if (!busy) void connectNearby(mixer); }} />)}
        {!nearby.mixers.length && <Text style={{ color: theme.muted, fontSize: 15, lineHeight: 21 }}>
          {nearby.message || (nearby.status === 'searching' ? 'Looking for mixers on your network…' : 'No mixers found. Try Manual.')}
        </Text>}
        {!!nearby.mixers.length && !!nearby.message && <Message>{nearby.message}</Message>}
      </View> : <>
      <View style={{ backgroundColor: theme.panel, borderRadius: 18, paddingHorizontal: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Icon name={{ ios: 'network', android: 'wifi', web: 'wifi' }} color={theme.muted} />
        <TextInput testID="mixer-address" accessibilityLabel="Mixer address" value={address} onChangeText={setAddress} placeholder="192.168.1.100:8082" placeholderTextColor={theme.muted}
          autoCapitalize="none" autoCorrect={false} keyboardType="url" returnKeyType="go" editable={!busy} onSubmitEditing={() => { if (!busy) void connect(); }}
          style={{ flex: 1, color: theme.text, fontSize: 17, minHeight: 56, paddingVertical: 16 }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 5, marginBottom: 24 }}>
        <NativeButton title={busy ? 'Connecting…' : 'Connect'} symbol="wifi" prominent disabled={busy || !address.trim()} onPress={() => void connect()} />
        <NativeButton title="Scan code" symbol="qrcode.viewfinder" disabled={busy} onPress={() => router.push('/scan')} />
      </View>
      {!!state.recent.length && <>
        <Text style={{ color: theme.muted, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>RECENT MIXERS</Text>
        {state.recent.map(item => <View key={item.url} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}><Row title={new URL(item.url).host} detail={state.server === item.url ? 'Current mixer' : 'Tap to connect'} onPress={() => { if (!busy) void connect(item.url); }} /></View>
          <Pressable accessibilityLabel={'Forget ' + new URL(item.url).host} accessibilityRole="button" disabled={busy} onPress={() => void session.forget(item.url)}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name={{ ios: 'minus.circle', android: 'remove_circle_outline', web: 'remove_circle_outline' }} size={20} color={theme.muted} /></Pressable>
        </View>)}
      </>}
      </>}
      <Message error>{error}</Message>
    </ScrollView>
  </View>;
}
