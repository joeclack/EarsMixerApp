import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { requireOptionalNativeModule } from 'expo';
import { findStartupMixers, reachableMixer } from '../discovery/startup';
import type { DiscoveryNative } from '../discovery/browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../mixer/context';
import { mixerLabel } from '../connection';
import { useTheme } from '../theme';
import { Message } from './ui';
import SetupProgress from './SetupProgress';
import NativeButton from './NativeButton';
import SetupList from './SetupList';
import SetupPreview from './SetupPreview';
import TemplatesList from './TemplatesList';
import { useToolbarHaptic } from './useToolbarHaptic';

const steps = [
  { title: 'Set your nickname', body: 'This name identifies your connection to the mixer. Others on your mix see it.', bullets: [] },
  { title: 'Connect to a mixer', body: 'Make sure you are on the correct Wi-Fi.', bullets: [] },
  { title: 'Portrait or landscape', body: 'Hold your phone upright for a list of faders, or turn it sideways for faders like the desk.', bullets: [] },
  { title: 'Start with a template', body: 'Choose a layout to start with. Desk levels stay unchanged, and you can change it any time in the Channels tab.', bullets: [] },
];
export default function SetupWalkthrough() {
  const { session, state, mix } = useSession(), theme = useTheme(), haptic = useToolbarHaptic();
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
  return <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: theme.bg }}>
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
        {step === 2 && <View style={{ flexGrow: 0, flexShrink: 1, height: 230, minHeight: 0, overflow: 'hidden' }}>
          <SetupPreview step={step} />
        </View>}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 10 }}>
          <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 30, fontWeight: '700' }}>{current.title}</Text>
          {!!current.body && <Text style={{ color: theme.muted, fontSize: 17, lineHeight: 25 }}>{current.body}</Text>}
          {step === 0 && <TextInput accessibilityLabel="Nickname" placeholder="Nickname" placeholderTextColor={theme.muted} value={state.settings.nickname}
            onChangeText={nickname => session.setSettings({ nickname })} maxLength={80} autoComplete="name" autoCapitalize="words" autoCorrect={false} returnKeyType="next"
            onSubmitEditing={() => { if (!nickname) return; Keyboard.dismiss(); setStep(1); }}
            style={{ fontSize: 20, color: theme.text, paddingVertical: 14, marginTop: 6, borderBottomWidth: 1, borderBottomColor: theme.line }} />}
          {step === 1 && <View style={{ gap: 14, alignItems: 'flex-start', marginTop: 6 }}>
            <Text accessibilityLiveRegion="polite" style={{ color: mix.status === 'connected' ? theme.green : theme.muted, fontSize: 17 }}>
              {state.pinPrompt ? 'PIN needed' : state.demo ? 'Demo mode' : mix.status === 'connected' && state.server ? 'Connected to ' + mixerLabel(state.server, state.recent) : state.connecting || mix.status === 'connecting' || mix.status === 'loading' ? 'Connecting…' : checking ? 'Looking for a mixer…' : 'Not connected'}
            </Text>
            <NativeButton title={state.server ? 'Change mixer' : 'Connect'} bordered onPress={() => router.push('/connect')} />
          </View>}
          {step === 3 && mix.status !== 'connected' && <Text style={{ color: theme.muted, fontSize: 17 }}>Connect to a mixer to see its templates.</Text>}
          <Message error>{state.message}</Message>
        </View>
        {/* The mixer's templates are listed right here, rather than behind a button. */}
        {step === 3 && mix.status === 'connected' ? <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
          <TemplatesList intro={false} />
        </ScrollView> : current.bullets.length ? <SetupList items={current.bullets} featured={'featured' in current ? current.featured : undefined} /> : <View style={{ flex: 1 }} />}
      </Animated.View>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, maxWidth: 600, width: '100%', alignSelf: 'center' }}>
        <NativeButton title={next} prominent fullWidth disabled={finishing || (step === 0 && !nickname)} onPress={() => {
          haptic();
          Keyboard.dismiss();
          if (step < steps.length - 1) setStep(value => value + 1);
          else { setFinishing(true); void session.completeSetup().then(() => router.back()).finally(() => setFinishing(false)); }
        }} />
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
