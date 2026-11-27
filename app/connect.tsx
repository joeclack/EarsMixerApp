import ScreenSurface from '../src/components/ScreenSurface';
import FieldSurface from '../src/components/FieldSurface';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme';
import { useSession } from '../src/mixer/context';
import { Icon, Message, Row } from '../src/components/ui';
import CloseButton from '../src/components/CloseButton';
import NativeButton from '../src/components/NativeButton';
import Segmented from '../src/components/Segmented';
import { PanelHeading } from '../src/components/ConsoleDetails';
import { useNearbyMixers } from '../src/discovery/useNearbyMixers';
import { reachableMixer, type NearbyMixer } from '../src/discovery/browser';
export default function Connect() {
  const { session, state } = useSession();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [address, setAddress] = useState((!state.demo && state.server) || state.recent[0]?.url || '');
  // Opened after a scanned code failed to connect, show why. Opened at launch
  // after the saved mixer didn't answer, the nearby search says what to do instead.
  const { failed } = useLocalSearchParams<{ failed?: string }>();
  const [error, setError] = useState(failed && !state.server && !state.connecting ? state.message : '');
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
  return <ScreenSurface><ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: 24, paddingTop: 32, paddingBottom: insets.bottom + 24 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}>Connect to mixer</Text>
          <Text style={{ color: theme.muted, fontSize: 15, marginTop: 6, lineHeight: 21 }}>Select a server or enter its address.</Text>
        </View>
        <CloseButton onPress={() => router.back()} />
      </View>
      <View style={{ marginBottom: 24 }}>
        <Segmented label="Connection method" value={mode} options={[{ value: 'auto', label: 'Discovery' }, { value: 'manual', label: 'Manual' }]}
          onChange={value => { if (!busy) { Keyboard.dismiss(); setError(''); setMode(value); } }} />
      </View>
      {mode === 'auto' ? <View style={{ marginBottom: 24 }}>
        <View style={{ marginBottom: 8 }}>
          <PanelHeading title="Nearby mixers" trailing={nearby.status === 'searching' && !!nearby.mixers.length
            && <ActivityIndicator accessibilityLabel="Still looking for mixers" color={theme.tint} />} />
        </View>
        {nearby.mixers.map(mixer => <Row key={mixer.id} title={mixer.name} detail={new URL(mixer.urls[0]).host}
          onPress={() => { if (!busy) void connectNearby(mixer); }} />)}
        {/* The search keeps going while the sheet is open, so it always looks busy. */}
        {!nearby.mixers.length && nearby.status === 'searching' && <View accessible accessibilityLiveRegion="polite"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 18 }}>
          <ActivityIndicator color={theme.tint} />
          <Text style={{ flex: 1, color: theme.muted, fontSize: 15, lineHeight: 21 }}>{nearby.slow
            ? "Still looking. Check you're on the mixer's Wi‑Fi, or try Manual." : 'Looking for mixers on your network…'}</Text>
        </View>}
        {nearby.status === 'error' && <>
          <Message error>{nearby.message || 'Could not search for nearby mixers.'}</Message>
          <View style={{ marginTop: 14 }}><NativeButton title="Try again" bordered fullWidth disabled={busy} onPress={nearby.retry} /></View>
        </>}
      </View> : <>
      <FieldSurface style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Icon name={{ ios: 'network', android: 'wifi', web: 'wifi' }} color={theme.muted} />
        <TextInput testID="mixer-address" accessibilityLabel="Mixer address" value={address} onChangeText={setAddress} placeholder="192.168.1.100:8082" placeholderTextColor={theme.muted}
          autoCapitalize="none" autoCorrect={false} keyboardType="url" returnKeyType="go" editable={!busy} onSubmitEditing={() => { if (!busy) void connect(); }}
          // Keep the web input above the panel's positioned decorative gradient.
          style={{ position: 'relative', flex: 1, color: theme.text, fontSize: 17, minHeight: 56, paddingVertical: 16 }} />
      </FieldSurface>
      <View style={{ gap: 10, marginTop: 14, marginBottom: 24 }}>
        <NativeButton title={busy ? 'Connecting…' : 'Connect'} symbol="wifi" prominent fullWidth disabled={busy || !address.trim()} onPress={() => void connect()} />
        <NativeButton title="Scan code" bordered fullWidth symbol="qrcode.viewfinder" disabled={busy} onPress={() => router.push('/scan')} />
      </View>
      {!!state.recent.length && <>
        <View style={{ marginBottom: 8 }}><PanelHeading title="Recent mixers" /></View>
        {state.recent.map(item => <View key={item.url} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}><Row title={item.name || new URL(item.url).host}
            detail={[item.name && new URL(item.url).host, state.server === item.url ? 'Current mixer' : !item.name && 'Tap to connect'].filter(Boolean).join(' · ')}
            onPress={() => { if (!busy) void connect(item.url); }} /></View>
          <Pressable android_disableSound accessibilityLabel={'Forget ' + (item.name || new URL(item.url).host)} accessibilityRole="button" disabled={busy} onPress={() => void session.forget(item.url)}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name={{ ios: 'minus.circle', android: 'remove_circle_outline', web: 'remove_circle_outline' }} size={20} color={theme.muted} /></Pressable>
        </View>)}
      </>}
      </>}
      <Message error>{error}</Message>
      <NativeButton title="Try demo" bordered disabled={busy} onPress={() => {
        setError('');
        void session.startDemo().then(() => router.back()).catch(() => setError('Could not start demo. Try again.'));
      }} />
  </ScrollView></ScreenSurface>;
}
