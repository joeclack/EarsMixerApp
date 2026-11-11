import ScreenSurface from './ScreenSurface';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { requireOptionalNativeModule } from 'expo';
import { findStartupMixers, reachableMixer } from '../discovery/startup';
import type { DiscoveryNative } from '../discovery/browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { Message } from './ui';
import HardwareEmblem from './HardwareEmblem';
import SetupProgress from './SetupProgress';
import NativeButton from './NativeButton';
import { Engraved, Led, StepNumber } from './ConsoleDetails';

const steps = [
  { title: 'Set your nickname', symbol: 'person.crop.circle' as const, material: 'account_circle' as const, body: 'This name identifies your connection to the mixer.', bullets: [] },
  { title: 'Connect to a mixer', symbol: 'wifi' as const, material: 'wifi' as const, body: 'Make sure you are on the correct Wi-Fi.', bullets: [] },
  { title: 'Choose a template (optional)', symbol: 'square.stack' as const, material: 'layers' as const, body: '', bullets: ['Open the … menu and tap Templates.', 'Choose a saved layout, or keep your own.', 'Templates never change desk levels.'] },
  { title: 'Adjust your mix', symbol: 'slider.horizontal.3' as const, material: 'tune' as const, body: '', bullets: ['Tap the headphones button to choose your AUX.', 'Choose Level or Pan in the … menu.', 'Drag a handle to adjust.', 'Long press a fader for a tall, finer fader.'] },
  { title: 'Go landscape', symbol: 'rotate.right' as const, material: 'screen_rotation' as const, body: 'Turn your phone sideways for a bank of vertical faders, just like the desk.', bullets: ['Scroll sideways through your channels.', 'Use the side rail to switch AUX and choose Level or Pan.', 'Set every level to off from the rail.'] },
  { title: 'Keep your layout', symbol: 'eye.slash' as const, material: 'visibility_off' as const, body: '', bullets: ['Tap Edit to reorder or hide channels.', 'Layouts save automatically on this phone.', 'Reconnects to your last mixer.'] },
];
export default function SetupWalkthrough() {
  const { session, state, mix } = useSession(), theme = useTheme();
  const [step, setStep] = useState(0), [finishing, setFinishing] = useState(false);
  const current = steps[step];
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    if (step !== 1 || session.state.server || session.state.connecting) return;
    const controller = new AbortController();
    setChecking(true);
    void (async () => {
      if (session.state.lastServer) {
        try { await session.connect(session.state.lastServer); if (session.state.server) return; } catch {}
      }
      const native = Platform.OS === 'web' ? null : requireOptionalNativeModule<DiscoveryNative>('EarsMixerDiscovery');
      const mixers = await findStartupMixers(native, session.state.recent.map(item => item.url), controller.signal);
      if (mixers.length === 1 && !controller.signal.aborted && !session.state.server && !session.state.connecting) {
        const url = await reachableMixer(mixers[0], controller.signal);
        if (!controller.signal.aborted && !session.state.server && !session.state.connecting) await session.connect(url);
      }
    })().catch(() => {}).finally(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => { controller.abort(); setChecking(false); };
  }, [step, session]);
  return <ScreenSurface><SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
    <View style={{ paddingHorizontal: 28, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, maxWidth: 600, width: '100%', alignSelf: 'center' }}>
      <Engraved size={11} accessibilityLiveRegion="polite" accessibilityLabel={`Step ${step + 1} of ${steps.length}`} style={{ letterSpacing: 1.6 }}>
        Step {step + 1} / {steps.length}
      </Engraved>
      <SetupProgress step={step} count={steps.length} />
    </View>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false} style={{ flex: 1 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{ flexGrow: 1, padding: 28, gap: 24, justifyContent: 'flex-start', maxWidth: 600, width: '100%', alignSelf: 'center' }}>
      <Animated.View key={step} entering={FadeIn.duration(160).reduceMotion(ReduceMotion.System)} style={{ gap: 24 }}>
      <HardwareEmblem name={{ ios: current.symbol, android: current.material, web: current.material }} />
      <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 30, fontWeight: '700' }}>{current.title}</Text>
      {!!current.body && <Text style={{ color: theme.muted, fontSize: 17, lineHeight: 26 }}>{current.body}</Text>}
      {!!current.bullets.length && <View accessibilityRole="list" style={{ gap: 16 }}>
        {current.bullets.map((text, index) => <View key={text} style={{ flexDirection: 'row', gap: 12 }}>
          <StepNumber value={index + 1} />
          <Text style={{ flex: 1, color: theme.muted, fontSize: 17, lineHeight: 26 }}>{text}</Text>
        </View>)}
      </View>}
      {step === 0 && <TextInput accessibilityLabel="Nickname" placeholder="Nickname (optional)" placeholderTextColor={theme.muted} value={state.settings.nickname}
        onChangeText={nickname => session.setSettings({ nickname })} maxLength={80} autoComplete="name" autoCapitalize="words" autoCorrect={false} returnKeyType="next"
        onSubmitEditing={() => { Keyboard.dismiss(); setStep(1); }}
        style={{ fontSize: 20, color: theme.text, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.line }} />}
      {step === 1 && <View style={{ gap: 16, alignItems: 'flex-start' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Led size={8} color={mix.status === 'connected' || state.demo ? 'green' : 'amber'} on={state.demo || mix.status !== 'disconnected' || checking || state.connecting}
            pulse={!state.demo && mix.status !== 'connected'} />
          <Text accessibilityLiveRegion="polite" style={{ color: mix.status === 'connected' ? theme.green : theme.muted, fontSize: 17 }}>
            {state.demo ? 'Demo mode' : mix.status === 'connected' && state.server ? 'Connected to ' + new URL(state.server).host : state.connecting || mix.status === 'connecting' || mix.status === 'loading' ? 'Connecting…' : checking ? 'Looking for a mixer…' : 'Not connected'}
          </Text>
        </View>
        <NativeButton title={state.server ? 'Change mixer' : 'Connect'} bordered onPress={() => router.push('/connect')} />
      </View>}
      <Message error>{state.message}</Message>
      </Animated.View>
    </ScrollView>
      <View style={{ minHeight: 100, paddingHorizontal: 28, paddingVertical: 20, maxWidth: 600, width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        {step > 0 ? <NativeButton title="Back" disabled={finishing} onPress={() => setStep(value => value - 1)} /> : <View />}
        <NativeButton title={step === steps.length - 1 ? 'Finish' : 'Next'} prominent disabled={finishing} onPress={() => {
          Keyboard.dismiss();
          if (step < steps.length - 1) setStep(value => value + 1);
          else { setFinishing(true); void session.completeSetup().then(() => router.back()).finally(() => setFinishing(false)); }
        }} />
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView></ScreenSurface>;
}
