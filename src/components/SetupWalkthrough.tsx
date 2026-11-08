import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { Icon, Message } from './ui';
import NativeButton from './NativeButton';

const steps = [
  { title: 'Set your nickname', symbol: 'person.crop.circle' as const, body: 'This name identifies your connection to the mixer.', bullets: [] },
  { title: 'Connect to a mixer', symbol: 'wifi' as const, body: 'Make sure you are on the correct Wi-Fi.', bullets: [] },
  { title: 'Adjust your mix', symbol: 'slider.horizontal.3' as const, body: '', bullets: ['Choose your AUX in the toolbar.', 'Drag a handle to change level or pan.', 'Rotate for vertical faders.'] },
  { title: 'Keep your layout', symbol: 'star' as const, body: '', bullets: ['Star favourites. Tap Edit to reorder.', 'Layouts save automatically on this phone.', 'Reconnects to your last mixer.'] },
];
export default function SetupWalkthrough() {
  const { session, state } = useSession(), theme = useTheme();
  const [step, setStep] = useState(0), [finishing, setFinishing] = useState(false);
  const current = steps[step];
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{ flexGrow: 1, padding: 28, gap: 24, justifyContent: 'flex-start', maxWidth: 600, width: '100%', alignSelf: 'center' }}>
      <Text accessibilityLiveRegion="polite" style={{ color: theme.muted, fontSize: 14 }}>Step {step + 1} of {steps.length}</Text>
      <Icon name={{ ios: current.symbol, android: step === 0 ? 'account_circle' : step === 1 ? 'wifi' : step === 2 ? 'tune' : 'star', web: step === 0 ? 'account_circle' : step === 1 ? 'wifi' : step === 2 ? 'tune' : 'star' }} size={48} />
      <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 30, fontWeight: '700' }}>{current.title}</Text>
      {!!current.body && <Text style={{ color: theme.muted, fontSize: 17, lineHeight: 26 }}>{current.body}</Text>}
      {!!current.bullets.length && <View accessibilityRole="list" style={{ gap: 16 }}>
        {current.bullets.map(text => <View key={text} style={{ flexDirection: 'row', gap: 12 }}>
          <Text style={{ color: theme.tint, fontSize: 18 }}>•</Text>
          <Text style={{ flex: 1, color: theme.muted, fontSize: 17, lineHeight: 26 }}>{text}</Text>
        </View>)}
      </View>}
      {step === 0 && <TextInput accessibilityLabel="Nickname" placeholder="Nickname (optional)" placeholderTextColor={theme.muted} value={state.settings.nickname}
        onChangeText={nickname => session.setSettings({ nickname })} maxLength={80} autoComplete="nickname" returnKeyType="next"
        onSubmitEditing={() => { Keyboard.dismiss(); setStep(1); }}
        style={{ fontSize: 20, color: theme.text, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.line }} />}
      <Message error>{state.message}</Message>
    </ScrollView>
      <View style={{ minHeight: 100, paddingHorizontal: 28, paddingVertical: 20, maxWidth: 600, width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        {step > 0 ? <NativeButton title="Back" disabled={finishing} onPress={() => setStep(value => value - 1)} /> : <View />}
        <NativeButton title={step === steps.length - 1 ? 'Find mixer' : 'Next'} prominent disabled={finishing} onPress={() => {
          Keyboard.dismiss();
          if (step < steps.length - 1) setStep(value => value + 1);
          else { setFinishing(true); void session.completeSetup().finally(() => setFinishing(false)); }
        }} />
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
