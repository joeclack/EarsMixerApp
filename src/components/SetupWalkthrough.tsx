import ScreenSurface from './ScreenSurface';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { requireOptionalNativeModule } from 'expo';
import { findStartupMixers, reachableMixer } from '../discovery/startup';
import type { DiscoveryNative } from '../discovery/browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { Message } from './ui';
import SetupProgress from './SetupProgress';
import NativeButton from './NativeButton';
import { Led } from './ConsoleDetails';
import SetupList from './SetupList';
import SetupPreview from './SetupPreview';

const steps = [
  { title: 'Set your nickname', body: 'This name identifies your connection to the mixer.', bullets: [] },
  { title: 'Connect to a mixer', body: 'Make sure you are on the correct Wi-Fi.', bullets: [] },
  { title: 'Choose a template (optional)', body: '', bullets: ['Open the … menu and tap Templates.', 'Choose a saved layout, or keep your own.', 'Templates never change desk levels.'] },
  { title: 'Adjust your mix', body: '', bullets: ['Tap the headphones button to choose your AUX.', 'Choose Level or Pan in the … menu.', 'Drag a handle to adjust.', 'Long press a fader for a tall, finer fader.'] },
  { title: 'Go landscape', body: 'Turn your phone sideways for a bank of vertical faders, just like the desk.', bullets: ['Scroll sideways through your channels.', 'Use the side rail to switch AUX and choose Level or Pan.', 'Set every level to off from the rail.'] },
  { title: 'Keep your layout', body: '', bullets: ['Tap Edit to reorder or hide channels.', 'Layouts save automatically on this phone.', 'Reconnects to your last mixer.'] },
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
  const nickname = state.settings.nickname.trim();
  const next = step === steps.length - 1 ? 'Finish' : step === 0 && nickname ? 'Hi, ' + nickname : 'Next';
  // Reference layout: Back and progress on top, a preview of the feature, the
  // title and short text, a native numbered list, then one full-width action.
  return <ScreenSurface><SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
    <View style={{ height: 52, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', maxWidth: 600, width: '100%', alignSelf: 'center' }}>
      <View style={{ flex: 1, alignItems: 'flex-start' }}>
        {step > 0 && <NativeButton title="Back" symbol="chevron.left" disabled={finishing} onPress={() => setStep(value => value - 1)} />}
      </View>
      <View accessible accessibilityLiveRegion="polite" accessibilityLabel={`Step ${step + 1} of ${steps.length}`}>
        <SetupProgress step={step} count={steps.length} />
      </View>
      <View style={{ flex: 1 }} />
    </View>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Animated.View key={step} entering={FadeIn.duration(160).reduceMotion(ReduceMotion.System)} style={{ flex: 1, maxWidth: 600, width: '100%', alignSelf: 'center' }}>
        <View style={{ flexGrow: 0, flexShrink: 1, height: current.bullets.length ? 230 : 280, minHeight: 0, overflow: 'hidden' }}>
          <SetupPreview step={step} nickname={state.settings.nickname} />
        </View>
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 10 }}>
          <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 30, fontWeight: '700' }}>{current.title}</Text>
          {!!current.body && <Text style={{ color: theme.muted, fontSize: 17, lineHeight: 25 }}>{current.body}</Text>}
          {step === 0 && <TextInput accessibilityLabel="Nickname" placeholder="Nickname (optional)" placeholderTextColor={theme.muted} value={state.settings.nickname}
            onChangeText={nickname => session.setSettings({ nickname })} maxLength={80} autoComplete="name" autoCapitalize="words" autoCorrect={false} returnKeyType="next"
            onSubmitEditing={() => { Keyboard.dismiss(); setStep(1); }}
            style={{ fontSize: 20, color: theme.text, paddingVertical: 14, marginTop: 6, borderBottomWidth: 1, borderBottomColor: theme.line }} />}
          {step === 1 && <View style={{ gap: 14, alignItems: 'flex-start', marginTop: 6 }}>
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
        </View>
        {current.bullets.length ? <SetupList items={current.bullets} /> : <View style={{ flex: 1 }} />}
      </Animated.View>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, maxWidth: 600, width: '100%', alignSelf: 'center' }}>
        <NativeButton title={next} prominent fullWidth disabled={finishing} onPress={() => {
          Keyboard.dismiss();
          if (step < steps.length - 1) setStep(value => value + 1);
          else { setFinishing(true); void session.completeSetup().then(() => router.back()).finally(() => setFinishing(false)); }
        }} />
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView></ScreenSurface>;
}
