import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, ChevronRight, Headphones, QrCode, RefreshCw, Settings2, Trash2, Wifi, X } from 'lucide-react-native';
import MixerView, { type MixerViewHandle } from './src/MixerView';
import { normalizeMixerAddress, probeMixer, readSavedMixers, rememberMixer, type SavedMixer } from './src/connection';

const STORAGE_KEY = 'earsmixer.connections.v1';
const colors = { bg: '#101215', panel: '#191c21', line: '#30343c', text: '#eef0f3', muted: '#a8afb9', accent: '#a5c5ff', error: '#edbd80' };

function AppContent() {
  const [ready, setReady] = useState(false);
  const [address, setAddress] = useState('');
  const [recent, setRecent] = useState<SavedMixer[]>([]);
  const [server, setServer] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [storageWarning, setStorageWarning] = useState('');
  const [loading, setLoading] = useState(true);
  const [mixerError, setMixerError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const scanBusy = useRef(false);
  const connectionAttempt = useRef<AbortController | null>(null);
  const mixer = useRef<MixerViewHandle>(null);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!mounted) return;
      const saved = readSavedMixers(raw);
      setRecent(saved); setAddress(saved[0]?.url || '');
    }).catch(() => { if (mounted) setStorageWarning('Saved addresses are unavailable. You can still connect.'); })
      .finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; connectionAttempt.current?.abort(); };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android' || (!server && !scanning)) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (scanning) setScanning(false); else setServer(null);
      return true;
    });
    return () => subscription.remove();
  }, [server, scanning]);

  async function saveRecent(next: SavedMixer[]) {
    setRecent(next);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    catch { setStorageWarning('This address could not be saved on this device.'); }
  }

  async function connect(input = address) {
    Keyboard.dismiss();
    connectionAttempt.current?.abort();
    const attempt = new AbortController();
    connectionAttempt.current = attempt;
    setError(''); setConnecting(true);
    try {
      const url = await probeMixer(input, { signal: attempt.signal });
      if (attempt.signal.aborted) return;
      setAddress(url); setLoading(true); setMixerError(''); setServer(url);
      await saveRecent(rememberMixer(recent, url));
    } catch (failure) {
      if (!attempt.signal.aborted) setError(failure instanceof Error ? failure.message : 'Could not connect to the mixer.');
    } finally {
      if (connectionAttempt.current === attempt) setConnecting(false);
    }
  }

  async function scan() {
    setError(''); setScanError('');
    const result = permission?.granted ? permission : await requestPermission();
    if (!result.granted) { setError('Allow camera access to scan a QR code, or enter the mixer address instead.'); return; }
    scanBusy.current = false; setScanning(true);
  }

  if (!ready) return <View style={styles.center}><ActivityIndicator color={colors.accent} accessibilityLabel="Loading saved mixers" /></View>;

  if (scanning) return <SafeAreaView style={styles.screen}>
    <View style={styles.toolbar}><Text style={styles.toolbarTitle}>Scan mixer QR code</Text><Pressable accessibilityRole="button" accessibilityLabel="Close scanner" onPress={() => setScanning(false)} style={styles.iconButton}><X color={colors.text} size={22} /></Pressable></View>
    <View style={styles.cameraWrap}><CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      onBarcodeScanned={({ data }) => {
        if (scanBusy.current) return;
        try {
          const url = normalizeMixerAddress(data);
          scanBusy.current = true; setScanning(false); setAddress(url); void connect(url);
        } catch { setScanError('Scan the mixer link from the EarsMixer admin dashboard or tray.'); }
      }} /><View pointerEvents="none" style={styles.scanFrame} /></View>
    <Text style={styles.scanHint}>{scanError || 'Open the connection QR code in EarsMixer, then point your camera at it.'}</Text>
  </SafeAreaView>;

  if (server) return <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
    <View style={styles.toolbar}>
      <Wifi color={colors.muted} size={17} /><Text numberOfLines={1} style={styles.serverName}>{new URL(server).host}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Reload mixer" onPress={() => { setMixerError(''); setLoading(true); mixer.current?.reload(); }} style={styles.iconButton}><RefreshCw color={colors.text} size={19} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Change mixer server" onPress={() => { setServer(null); setMixerError(''); }} style={styles.iconButton}><Settings2 color={colors.text} size={20} /></Pressable>
    </View>
    {mixerError ? <View style={styles.center}><Wifi color={colors.muted} size={36} /><Text style={styles.errorTitle}>Mixer unavailable</Text><Text style={styles.centerText}>{mixerError}</Text>
      <Pressable accessibilityRole="button" onPress={() => { setMixerError(''); setLoading(true); }} style={styles.primary}><RefreshCw color={colors.bg} size={18} /><Text style={styles.primaryText}>Retry connection</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => setServer(null)} style={styles.secondary}><Text style={styles.secondaryText}>Change address</Text></Pressable>
    </View> : <View style={styles.mixerWrap}><MixerView ref={mixer} url={server} onLoading={setLoading} onError={setMixerError} />
      {loading && <View pointerEvents="none" style={styles.loadingStrip}><ActivityIndicator size="small" color={colors.accent} /><Text style={styles.smallMuted}>Loading mixer…</Text></View>}
    </View>}
  </SafeAreaView>;

  return <SafeAreaView style={styles.screen}><ScrollView automaticallyAdjustKeyboardInsets keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
    <View style={styles.content}>
      <View style={styles.brand}><View style={styles.brandIcon}><Headphones size={25} color={colors.accent} /></View><Text style={styles.brandName}>EarsMixer</Text><Text style={styles.version}>v{Constants.expoConfig?.version || '—'}</Text></View>
      <View style={styles.intro}><View style={styles.networkLabel}><Wifi size={14} color={colors.accent} /><Text style={styles.networkLabelText}>LOCAL NETWORK</Text></View>
        <Text style={styles.heading}>Your mix.{ '\n' }Within reach.</Text><Text style={styles.subtitle}>Connect to EarsMixer and control your monitor mix from your phone.</Text></View>
      <Text style={styles.label}>Mixer address</Text>
      <TextInput accessibilityLabel="Mixer address" value={address} onChangeText={setAddress} placeholder="192.168.1.100:8082" placeholderTextColor="#69717d" autoCapitalize="none" autoCorrect={false} keyboardType="url" returnKeyType="go" onSubmitEditing={() => { if (!connecting) void connect(); }} style={styles.input} editable={!connecting} />
      <Text style={styles.help}>Use the address shown in the EarsMixer admin dashboard. Your phone and server must be on the same network.</Text>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Pressable accessibilityRole="button" accessibilityLabel="Connect to mixer" disabled={connecting || !address.trim()} onPress={() => void connect()} style={({ pressed }) => [styles.primary, (connecting || !address.trim()) && styles.disabled, pressed && styles.pressed]}>
        {connecting ? <ActivityIndicator color={colors.bg} /> : <ArrowRight color={colors.bg} size={20} />}<Text style={styles.primaryText}>{connecting ? 'Connecting…' : 'Connect to mixer'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={connecting} onPress={() => void scan()} style={styles.secondary}><QrCode size={19} color={colors.text} /><Text style={styles.secondaryText}>Scan mixer QR code</Text></Pressable>
      {recent.length > 0 && <View style={styles.recents}><Text style={styles.sectionTitle}>Recent mixers</Text>{recent.map(item => <View key={item.url} style={styles.recentRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={'Connect to ' + new URL(item.url).host} disabled={connecting} onPress={() => void connect(item.url)} style={styles.recentConnect}>
          <Wifi size={18} color={colors.muted} /><View style={styles.recentText}><Text style={styles.recentName}>{new URL(item.url).host}</Text><Text style={styles.smallMuted}>{item.url.startsWith('https:') ? 'HTTPS' : 'Local HTTP'}</Text></View><ChevronRight size={18} color={colors.muted} />
        </Pressable><Pressable accessibilityRole="button" accessibilityLabel={'Forget ' + new URL(item.url).host} disabled={connecting} onPress={() => void saveRecent(recent.filter(mixer => mixer.url !== item.url))} style={styles.iconButton}><Trash2 size={17} color={colors.muted} /></Pressable>
      </View>)}</View>}
      {!!storageWarning && <Text style={styles.help}>{storageWarning}</Text>}
      <Text style={styles.footer}>Your channels, faders and saved layouts stay with EarsMixer.</Text>
      {Platform.OS === 'web' && <Text style={styles.help}>Browser preview. Use the Android or iOS app for local-network connections without browser CORS restrictions.</Text>}
    </View>
  </ScrollView></SafeAreaView>;
}

export default function App() { return <SafeAreaProvider><StatusBar style="light" /><AppContent /></SafeAreaProvider>; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg }, scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24 }, content: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 }, brandIcon: { width: 42, height: 42, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }, brandName: { fontSize: 19, fontWeight: '700', color: colors.text }, version: { marginLeft: 'auto', color: colors.muted, fontSize: 12 },
  intro: { marginTop: 42, marginBottom: 30 }, networkLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }, networkLabelText: { fontSize: 11, letterSpacing: 1.6, fontWeight: '700', color: colors.accent }, heading: { fontSize: 44, lineHeight: 49, fontWeight: '700', letterSpacing: -1.7, color: colors.text }, subtitle: { marginTop: 16, color: colors.muted, fontSize: 16, lineHeight: 25 },
  label: { color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: 9 }, input: { borderWidth: 1, borderColor: '#46505e', backgroundColor: colors.panel, borderRadius: 10, padding: 15, fontSize: 16, color: colors.text, minHeight: 54 }, help: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 10, marginBottom: 16 },
  primary: { minHeight: 52, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 10, marginTop: 6 }, primaryText: { fontSize: 15, fontWeight: '700', color: colors.bg }, secondary: { minHeight: 50, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 13, borderRadius: 10, marginTop: 10 }, secondaryText: { color: colors.text, fontWeight: '600', fontSize: 14 }, disabled: { opacity: 0.45 }, pressed: { opacity: 0.8 }, error: { color: colors.error, fontSize: 13, lineHeight: 20, marginBottom: 10 },
  recents: { marginTop: 32 }, sectionTitle: { color: colors.muted, fontSize: 12, fontWeight: '600', marginBottom: 10 }, recentRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: colors.line }, recentConnect: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 }, recentText: { flex: 1, gap: 3 }, recentName: { color: colors.text, fontSize: 14, fontWeight: '500' }, smallMuted: { color: colors.muted, fontSize: 12 }, footer: { marginTop: 30, marginBottom: 12, color: '#77808c', fontSize: 12, lineHeight: 19 },
  toolbar: { minHeight: 48, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderColor: colors.line, backgroundColor: colors.panel }, toolbarTitle: { color: colors.text, fontWeight: '600', flex: 1 }, serverName: { flex: 1, fontSize: 12, color: colors.muted }, iconButton: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }, mixerWrap: { flex: 1 }, loadingStrip: { position: 'absolute', top: 8, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 9, padding: 10, borderRadius: 8, backgroundColor: colors.panel },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 12 }, centerText: { color: colors.muted, textAlign: 'center', lineHeight: 23, maxWidth: 340 }, errorTitle: { fontSize: 22, fontWeight: '700', color: colors.text }, cameraWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' }, scanFrame: { width: 240, height: 240, borderWidth: 2, borderColor: colors.accent, borderRadius: 20 }, scanHint: { padding: 24, color: colors.text, lineHeight: 22, textAlign: 'center' },
});
