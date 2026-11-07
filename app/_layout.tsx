import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Appearance, Platform, View } from 'react-native';
import { Stack, ThemeProvider, DarkTheme, DefaultTheme, router, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MixerProvider, useSession } from '../src/mixer/context';
import { useTheme } from '../src/theme';

export const unstable_settings = { initialRouteName: '(tabs)' };
function Navigation() {
  const { state } = useSession();
  const theme = useTheme();
  const navigation = useRootNavigationState();
  const prompted = useRef(false);
  useEffect(() => {
    if (Platform.OS !== 'web') Appearance.setColorScheme(state.settings.appearance === 'system' ? 'unspecified' : state.settings.appearance);
  }, [state.settings.appearance]);
  useEffect(() => {
    if (state.hydrated && navigation?.key && !prompted.current) {
      prompted.current = true;
      if (!state.server) router.push('/connect');
    }
  }, [state.hydrated, navigation?.key]);
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
      <Stack.Screen name="mixes" options={{ title: 'Choose your mix', presentation: 'formSheet', sheetAllowedDetents: [0.5, 0.9], sheetGrabberVisible: true }} />
      <Stack.Screen name="layout" options={{ title: 'Channel order', presentation: 'modal' }} />
    </Stack>
  </ThemeProvider>;
}
export default function RootLayout() { return <MixerProvider><Navigation /></MixerProvider>; }
