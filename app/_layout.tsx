import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Appearance, Platform, View } from 'react-native';
import { Stack, ThemeProvider, DarkTheme, DefaultTheme, router, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MixerProvider, useSession } from '../src/mixer/context';
import { requireOptionalNativeModule } from 'expo';
import { findStartupMixers, reachableMixer } from '../src/discovery/startup';
import type { DiscoveryNative } from '../src/discovery/browser';
import { useTheme } from '../src/theme';

export const unstable_settings = { initialRouteName: '(tabs)' };
function Navigation() {
  const { session, state } = useSession();
  const theme = useTheme();
  const navigation = useRootNavigationState();
  const prompted = useRef(false);
  useEffect(() => {
    if (Platform.OS !== 'web') Appearance.setColorScheme(state.settings.appearance === 'system' ? 'unspecified' : state.settings.appearance);
  }, [state.settings.appearance]);
  useEffect(() => {
    if (!state.hydrated || !navigation?.key || prompted.current) return;
    prompted.current = true;
    const controller = new AbortController();
    void (async () => {
      if (session.state.lastServer) {
        try { await session.connect(session.state.lastServer); if (session.state.server) return; } catch {}
      }
      if (controller.signal.aborted || session.state.server || session.state.connecting) return;
      const native = Platform.OS === 'web' ? null : requireOptionalNativeModule<DiscoveryNative>('EarsMixerDiscovery');
      const mixers = await findStartupMixers(native, session.state.recent.map(item => item.url), controller.signal);
      if (controller.signal.aborted || session.state.server || session.state.connecting) return;
      if (mixers.length === 1) {
        try {
          const url = await reachableMixer(mixers[0], controller.signal);
          if (!controller.signal.aborted && !session.state.server && !session.state.connecting) await session.connect(url);
          if (session.state.server) return;
        } catch {}
      }
      if (!controller.signal.aborted) router.push('/connect');
    })();
    return () => controller.abort();
  }, [state.hydrated, navigation?.key, session]);
  if (!state.hydrated) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.bg }}><ActivityIndicator /></View>;
  return <ThemeProvider value={theme.dark ? DarkTheme : DefaultTheme}>
    <StatusBar style={theme.dark ? 'light' : 'dark'} />
    <Stack screenOptions={{ contentStyle: { backgroundColor: theme.bg }, headerTintColor: theme.tint }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="connect" options={{
        headerShown: false, presentation: Platform.OS === 'web' ? 'modal' : 'formSheet',
        sheetAllowedDetents: [0.58, 0.92], sheetInitialDetentIndex: 0, sheetGrabberVisible: true,
        sheetCornerRadius: 32, sheetExpandsWhenScrolledToEdge: true, contentStyle: { backgroundColor: 'transparent' },
      }} />
      <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal', headerShown: false }} />
      <Stack.Screen name="layout" options={{ title: 'Channel order', presentation: 'modal' }} />
    </Stack>
  </ThemeProvider>;
}
export default function RootLayout() { return <MixerProvider><Navigation /></MixerProvider>; }
