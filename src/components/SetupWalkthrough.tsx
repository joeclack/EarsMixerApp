import { useState } from 'react';
import { Keyboard, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { Icon, Message } from './ui';
import NativeButton from './NativeButton';

const steps = [
  { title: 'Set your nickname', symbol: 'person.crop.circle' as const, body: 'This name identifies your connection to the mixer.' },
  { title: 'Connect to a mixer', symbol: 'wifi' as const, body: 'Make sure you are on the correct Wi-Fi.' },
  { title: 'Adjust your mix', symbol: 'slider.horizontal.3' as const, body: 'Choose your AUX in the top toolbar. Drag a fader handle to change its level. Use Pan to adjust stereo position. Turn your phone sideways for vertical faders.' },
  { title: 'Keep your layout', symbol: 'star' as const, body: 'Star channels you use most and tap Edit to reorder them. Your layout, favourites and selected AUX save automatically on this phone. The app remembers your last mixer and reconnects next time. Desk levels always come from the live mixer.' },
];
export default function SetupWalkthrough() {
  const { session, state } = useSession(), theme = useTheme();
  const [step, setStep] = useState(0), [finishing, setFinishing] = useState(false);
  const current = steps[step];
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
    <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{ flexGrow: 1, padding: 28, gap: 24, justifyContent: 'center', maxWidth: 600, width: '100%', alignSelf: 'center' }}>
      <Text accessibilityLiveRegion="polite" style={{ color: theme.muted, fontSize: 14 }}>Step {step + 1} of {steps.length}</Text>
      <Icon name={{ ios: current.symbol, android: step === 0 ? 'account_circle' : step === 1 ? 'wifi' : step === 2 ? 'tune' : 'star', web: step === 0 ? 'account_circle' : step === 1 ? 'wifi' : step === 2 ? 'tune' : 'star' }} size={48} />
      <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 30, fontWeight: '700' }}>{current.title}</Text>
      <Text style={{ color: theme.muted, fontSize: 17, lineHeight: 26 }}>{current.body}</Text>
      {step === 0 && <TextInput accessibilityLabel="Nickname" placeholder="Nickname (optional)" placeholderTextColor={theme.muted} value={state.settings.nickname}
        onChangeText={nickname => session.setSettings({ nickname })} maxLength={80} autoComplete="nickname" returnKeyType="next"
        onSubmitEditing={() => { Keyboard.dismiss(); setStep(1); }}
        style={{ fontSize: 20, color: theme.text, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.line }} />}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        {step > 0 ? <NativeButton title="Back" disabled={finishing} onPress={() => setStep(value => value - 1)} /> : <View />}
        <NativeButton title={step === steps.length - 1 ? 'Find mixer' : 'Next'} prominent disabled={finishing} onPress={() => {
          Keyboard.dismiss();
          if (step < steps.length - 1) setStep(value => value + 1);
          else { setFinishing(true); void session.completeSetup().finally(() => setFinishing(false)); }
        }} />
      </View>
      <Message error>{state.message}</Message>
    </ScrollView>
  </SafeAreaView>;
}
