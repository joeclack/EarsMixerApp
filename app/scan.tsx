import ScreenSurface from '../src/components/ScreenSurface';
import { useEffect, useRef, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import CloseButton from '../src/components/CloseButton';
import { useSession } from '../src/mixer/context';
import { useTheme } from '../src/theme';
import NativeButton from '../src/components/NativeButton';
import { normalizeMixerAddress } from '../src/connection';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
// A full-screen modal needs its own provider to learn the notch and home
// indicator insets, as the setup screen does.
export default function Scan() { return <SafeAreaProvider><Scanner /></SafeAreaProvider>; }
function Scanner() {
  const { session } = useSession(), theme = useTheme();
  const [permission, request] = useCameraPermissions();
  const insets = useSafeAreaInsets();
  const [error, setError] = useState('');
  const scanning = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  function close() {
    alive.current = false;
    scanning.current = true;
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }
  return <ScreenSurface><View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }}>
    <View style={{ flexDirection: 'row', paddingLeft: 20, paddingRight: 12, paddingVertical: 12, alignItems: 'center', gap: 12 }}>
      <Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}
        style={{ color: theme.text, fontSize: 22, fontWeight: '700', flex: 1, minWidth: 0 }}>Scan mixer code</Text>
      <CloseButton label="Close scanner" onPress={close} />
    </View>
    {permission?.granted ? <View style={{ flex: 1, overflow: 'hidden' }}><CameraView style={{ flex: 1 }} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => {
      if (scanning.current || !alive.current) return;
      let address: string;
      try { address = normalizeMixerAddress(data); }
      catch (error) { setError(error instanceof Error ? error.message : 'Could not read this code.'); return; }
      // A readable mixer code: confirm with a tap and close straight away. The
      // connection carries on behind the mixer's own loading screen.
      scanning.current = true; alive.current = false;
      if (session.state.settings.haptics) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const setup = !session.state.setupComplete;
      // Target a route rather than blindly popping whichever nested stack is focused.
      router.dismissTo(setup ? '/setup' : '/(tabs)/(mixer)');
      // Setup shows a failed connection itself; otherwise reopen the connect sheet with the reason.
      session.connect(address).catch(() => { if (!setup && !session.state.server) router.push('/connect'); });
    }} /><View pointerEvents="none" style={{ position: 'absolute', top: '25%', left: '18%', width: '64%', aspectRatio: 1, borderRadius: 30, borderWidth: 2, borderColor: '#FFFFFF' }} /></View>
      : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }}>
        <Text style={{ color: theme.text, textAlign: 'center', fontSize: 18 }}>Allow camera access to scan the mixer’s connection code.</Text>
        <NativeButton title="Allow camera" prominent onPress={() => void request()} />
      </View>}
    <Text accessibilityLiveRegion="polite" style={{ color: error ? theme.danger : theme.muted, paddingHorizontal: 24, paddingVertical: 16, fontSize: 15, lineHeight: 21, textAlign: 'center' }}>
      {error || 'Open the QR code in your EarsMixer dashboard or tray.'}
    </Text>
  </View></ScreenSurface>;
}
