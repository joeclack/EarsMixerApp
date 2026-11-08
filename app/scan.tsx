import { useRef, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';
import { useSession } from '../src/mixer/context';
import { useTheme } from '../src/theme';
import NativeButton from '../src/components/NativeButton';
import { normalizeMixerAddress } from '../src/connection';
export default function Scan() {
  const { session } = useSession(), theme = useTheme();
  const [permission, request] = useCameraPermissions();
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const scanning = useRef(false);
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
    <View style={{ flexDirection: 'row', padding: 20, alignItems: 'center', gap: 14 }}>
      <Text style={{ color: theme.text, fontSize: 22, fontWeight: '700', flex: 1 }}>Scan mixer code</Text>
      <NativeButton title="Done" onPress={() => router.back()} />
    </View>
    {permission?.granted ? <View style={{ flex: 1 }}><CameraView style={{ flex: 1 }} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={async ({ data }) => {
      if (scanning.current) return;
      try {
        const address = normalizeMixerAddress(data);
        scanning.current = true; setBusy(true); setError('');
        await session.connect(address);
        if (session.state.setupComplete) router.dismissAll();
        else router.dismissTo('/setup');
      } catch (error) { setError(error instanceof Error ? error.message : 'Could not read this code.'); }
      finally { setBusy(false); scanning.current = false; }
    }} /><View pointerEvents="none" style={{ position: 'absolute', top: '25%', left: '18%', width: '64%', aspectRatio: 1, borderRadius: 30, borderWidth: 2, borderColor: '#FFFFFF' }} /></View>
      : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }}>
        <Text style={{ color: theme.text, textAlign: 'center', fontSize: 18 }}>Allow camera access to scan the mixer’s connection code.</Text>
        <NativeButton title="Allow camera" prominent onPress={() => void request()} />
      </View>}
    <Text accessibilityLiveRegion="polite" style={{ color: error ? theme.danger : theme.muted, padding: 24, fontSize: 15, lineHeight: 23, textAlign: 'center' }}>
      {busy ? 'Connecting to your mixer…' : error || 'Open the QR code in your EarsMixer dashboard or tray.'}
    </Text>
  </SafeAreaView>;
}
