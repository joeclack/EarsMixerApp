import ConfirmationToast from '../src/components/ConfirmationToast';
import LoadingTransition from '../src/components/LoadingTransition';
import React, { useEffect, useRef } from 'react';
import { Appearance, Platform } from 'react-native';
import { Stack, ThemeProvider, DarkTheme, DefaultTheme, router, useRootNavigationState, usePathname } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { MixerProvider, useSessionState } from '../src/mixer/context';
import { requireOptionalNativeModule } from 'expo';
import { findStartupMixers, reachableMixer } from '../src/discovery/startup';
import type { DiscoveryNative } from '../src/discovery/browser';
import { useTheme } from '../src/theme';
import { warmFaderArtwork } from '../src/components/faderArtwork';

const sheetOptions = {
  headerShown: false, presentation: (Platform.OS === 'web' ? 'modal' : 'formSheet') as 'modal' | 'formSheet',
  sheetAllowedDetents: [0.6, 0.9], sheetGrabberVisible: true,
};

export const unstable_settings = { anchor: '(tabs)' };
function Navigation() {
  const { session, state } = useSessionState();
  const theme = useTheme();
  const navigation = useRootNavigationState();
  const prompted = useRef(false);
  const setupPresented = useRef(false);
  const pathname = usePathname();
  useEffect(() => {
    if (Platform.OS !== 'web') Appearance.setColorScheme(state.settings.appearance === 'system' ? 'unspecified' : state.settings.appearance);
  }, [state.settings.appearance]);
  useEffect(() => {
    if (!state.setupComplete) {
      prompted.current = false;
      if (state.hydrated && navigation?.key && !setupPresented.current) { setupPresented.current = true; router.push('/setup'); }
      return;
    }
    setupPresented.current = false;
    if (pathname === '/setup') return;
    if (!state.hydrated || !navigation?.key || prompted.current) return;
    prompted.current = true;
    const controller = new AbortController();
    void (async () => {
      if (session.state.server) return;
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
  }, [state.hydrated, state.setupComplete, navigation?.key, pathname, session]);
  return <LoadingTransition loading={!state.hydrated}>{state.hydrated && <ThemeProvider value={theme.dark ? DarkTheme : DefaultTheme}>
    <StatusBar style={theme.dark ? 'light' : 'dark'} />
    <Stack screenOptions={{ contentStyle: { backgroundColor: theme.bg }, headerTintColor: theme.tint }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: 'Settings', headerBackTitle: 'Mixer' }} />
      <Stack.Screen name="setup" options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }} />
      <Stack.Screen name="connect" options={sheetOptions} />
      <Stack.Screen name="templates" options={sheetOptions} />
      <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal', headerShown: false }} />
      <Stack.Screen name="layout" options={{ title: 'Channel order', presentation: 'modal' }} />
      <Stack.Screen name="groups" options={{ title: 'Channel groups', headerBackTitle: 'Mixer', presentation: 'card' }} />
      <Stack.Screen name="group" options={{ title: 'Edit group', headerBackTitle: 'Groups', presentation: 'card' }} />
      <Stack.Screen name="loading-preview" options={{ presentation: 'fullScreenModal', headerShown: false }} />
    </Stack>
  </ThemeProvider>}</LoadingTransition>;
}
export default function RootLayout() {
  useEffect(() => { void warmFaderArtwork(); }, []);
  return <GestureHandlerRootView style={{ flex: 1 }}><MixerProvider><Navigation /><ConfirmationToast /></MixerProvider></GestureHandlerRootView>;
}
