import ConfirmationToast from '../src/components/ConfirmationToast';
import LoadingTransition from '../src/components/LoadingTransition';
import React, { useEffect, useRef, useState } from 'react';
import { Appearance, Platform } from 'react-native';
import { Stack, ThemeProvider, DarkTheme, DefaultTheme, router, useRootNavigationState, usePathname } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { MixerProvider, useSessionState } from '../src/mixer/context';
import { SAVED_MIXER_TIMEOUT_MS } from '../src/mixer/session';
import { requireOptionalNativeModule } from 'expo';
import { findStartupMixers, reachableMixer } from '../src/discovery/startup';
import type { DiscoveryNative } from '../src/discovery/browser';
import { useTheme } from '../src/theme';
import { warmFaderArtwork } from '../src/components/faderArtwork';
import { StartupCover } from '../src/components/MixerLoadingBoundary';

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
  // The startup loader only covers loading saved settings. It never waits on the
  // network: reconnecting to the last mixer shows the mixer's own loader, which
  // says what it is doing, so an unreachable mixer doesn't hold up launch.
  const [starting, setStarting] = useState(true);
  const hasNickname = session.hasNickname();
  const [startupDone, setStartupDone] = useState(false);
  const covering = !startupDone && (!state.hydrated || starting);
  useEffect(() => { if (!covering) setStartupDone(true); }, [covering]);
  useEffect(() => {
    if (Platform.OS !== 'web') Appearance.setColorScheme(state.settings.appearance === 'system' ? 'unspecified' : state.settings.appearance);
  }, [state.settings.appearance]);
  useEffect(() => {
    if (state.hydrated && (!state.setupComplete || !hasNickname || !state.lastServer || session.state.server)) setStarting(false);
    if (!state.setupComplete) {
      prompted.current = false;
      if (state.hydrated && navigation?.key && !setupPresented.current) { setupPresented.current = true; router.push('/setup'); }
      return;
    }
    setupPresented.current = false;
    if (pathname === '/setup') return;
    // Devices set up before the nickname was required add one before connecting.
    if (!hasNickname) {
      if (state.hydrated && navigation?.key && pathname !== '/nickname') router.push('/nickname');
      return;
    }
    if (!state.hydrated || !navigation?.key || prompted.current) return;
    prompted.current = true;
    const controller = new AbortController();
    void (async () => {
      if (session.state.server) return;
      if (session.state.lastServer) {
        // A mixer on the same network answers well within this. Beyond it, stop
        // holding the startup loader and fall back to discovery.
        const connecting = session.connect(session.state.lastServer, { probeTimeoutMs: SAVED_MIXER_TIMEOUT_MS });
        // connect() marks the session as connecting synchronously, so the mixer
        // loading state takes over from here without a gap.
        setStarting(false);
        try { await connecting; if (session.state.server) return; } catch {}
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
  }, [state.hydrated, state.setupComplete, hasNickname, navigation?.key, pathname, session]);
  // Ask for the connection PIN whenever the mixer requires it. The connect and
  // scan screens close themselves once connected, which would take a PIN sheet
  // opened above them with it, so wait for them to close first.
  const pinNeeded = !!state.pinPrompt;
  const pinPresented = useRef(false);
  useEffect(() => {
    if (!pinNeeded) { pinPresented.current = false; return; }
    if (pinPresented.current || !state.hydrated || !navigation?.key || pathname === '/connect' || pathname === '/scan' || pathname === '/nickname') return;
    // Only a new request opens the sheet; closing it leaves the mixer's notice to reopen it.
    pinPresented.current = true;
    if (pathname !== '/pin') router.push('/pin');
  }, [pinNeeded, state.hydrated, navigation?.key, pathname]);
  return <StartupCover.Provider value={covering}><LoadingTransition loading={covering} ready={state.hydrated}>{state.hydrated && <ThemeProvider value={theme.dark ? DarkTheme : DefaultTheme}>
    <StatusBar style={theme.dark ? 'light' : 'dark'} />
    <Stack screenOptions={{ contentStyle: { backgroundColor: theme.bg }, headerTintColor: theme.tint }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="setup" options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }} />
      <Stack.Screen name="connect" options={sheetOptions} />
      <Stack.Screen name="pin" options={sheetOptions} />
      <Stack.Screen name="nickname" options={{ ...sheetOptions, gestureEnabled: false, sheetGrabberVisible: false }} />
      <Stack.Screen name="request" options={sheetOptions} />
      <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal', headerShown: false }} />
      <Stack.Screen name="layout" options={{ headerShown: false }} />
      <Stack.Screen name="groups" options={{ headerShown: false }} />
      <Stack.Screen name="group" options={{ title: 'Edit group', headerBackTitle: 'Groups', presentation: 'card' }} />
      <Stack.Screen name="loading-preview" options={{ presentation: 'fullScreenModal', headerShown: false }} />
    </Stack>
  </ThemeProvider>}</LoadingTransition></StartupCover.Provider>;
}
export default function RootLayout() {
  useEffect(() => { void warmFaderArtwork(); }, []);
  return <GestureHandlerRootView style={{ flex: 1 }}><MixerProvider><Navigation /><ConfirmationToast /></MixerProvider></GestureHandlerRootView>;
}
