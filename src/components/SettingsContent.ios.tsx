import React from 'react';
import { Platform } from 'react-native';
import Section from './HardwareSection.ios';
import { useResetDeviceData } from './useResetDeviceData';
import { useClearSavedLevels } from './useClearSavedLevels';
import { Host, Form, Section as FormSection, Toggle, Picker, Text, Button, VStack, HStack, Spacer, TextField, Image, useNativeState } from '@expo/ui/swift-ui';
import { font, foregroundStyle, tag, pickerStyle, buttonStyle, lineLimit, scrollContentBackground, disabled, multilineTextAlignment, frame, padding } from '@expo/ui/swift-ui/modifiers';
import { router } from 'expo-router';
import { appUpdateDetails } from '../appVersion';
import { useSession } from '../mixer/context';
import { mixerLabel } from '../connection';
import { useTheme } from '../theme';
export default function SettingsContent() {
  const { session, state, mix } = useSession(), theme = useTheme();
  // The mixer page has no connection control; Settings is the one place for it.
  const status = state.demo ? 'Demo' : mix.status === 'connected' ? 'Connected' : state.pinPrompt ? 'PIN needed' : mix.status === 'disconnected' ? 'Not connected' : 'Connecting…';
  const statusColor = state.demo ? theme.orange : mix.status === 'connected' ? theme.green : mix.status === 'disconnected' ? theme.danger : theme.orange;
  const nickname = useNativeState(state.settings.nickname);
  // The native field only reads its starting text once. Settings can be created
  // before first-time setup saves a nickname, so keep the field in step with the
  // saved nickname whenever the musician isn't typing in it.
  const nicknameFocused = React.useRef(false);
  React.useEffect(() => { if (!nicknameFocused.current) nickname.set(state.settings.nickname); }, [state.settings.nickname, nickname]);
  const reset = useResetDeviceData(() => nickname.set(''));
  const clearLevels = useClearSavedLevels();
  React.useEffect(() => () => { session.restoreNickname(); }, [session]);
  return <Host style={{ flex: 1 }} colorScheme={theme.scheme} seedColor={theme.tint}>
    <Form modifiers={[scrollContentBackground('hidden')]}>
      <Section title="Mixer connection" symbol="wifi" footer="Tap the mixer to change it, scan a code or enter an address.">
        <Button onPress={() => router.push('/connect')} modifiers={[buttonStyle('plain')]}>
          <HStack spacing={12}>
            <Image systemName={state.demo ? 'play.circle.fill' : mix.status === 'connected' ? 'wifi' : 'wifi.slash'} size={20} color={statusColor} />
            <VStack alignment="leading" spacing={2}>
              <Text modifiers={[lineLimit(1), font({ weight: 'semibold' })]}>{state.demo ? 'Demo mode' : state.server ? mixerLabel(state.server, state.recent) : 'Connect to a mixer'}</Text>
              <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(statusColor)]}>{status}</Text>
            </VStack>
            <Spacer />
            <Text modifiers={[foregroundStyle(theme.tint)]}>{state.server ? 'Change' : 'Connect'}</Text>
            <Image systemName="chevron.right" size={13} color={theme.muted} />
          </HStack>
        </Button>
        {!state.demo && <Button label="Try demo" systemImage="play.circle" onPress={() => void session.startDemo()} />}
        {state.server && <Button label="Disconnect" systemImage="xmark.circle" role="destructive" onPress={() => session.disconnect()} />}
      </Section>
      <Section title="This device" symbol="person.crop.circle">
        <TextField placeholder="Nickname" text={nickname} maxLength={80} onTextChange={value => session.setSettings({ nickname: value })}
          onFocusChange={focused => { nicknameFocused.current = focused; if (!focused) nickname.set(session.restoreNickname()); }} />
        {!state.settings.nickname.trim() && <Text modifiers={[foregroundStyle(theme.muted)]}>A nickname is required. Others on your mix see it.</Text>}
        {!!state.message && <Text>{state.message}</Text>}
      </Section>
      <Section title="Appearance" symbol="circle.lefthalf.filled">
        <Picker label="Appearance" systemImage="circle.lefthalf.filled" selection={state.settings.appearance}
          onSelectionChange={appearance => session.setSettings({ appearance })} modifiers={[pickerStyle('menu')]}>
          <Text modifiers={[tag('system')]}>System</Text><Text modifiers={[tag('light')]}>Light</Text><Text modifiers={[tag('dark')]}>Dark</Text>
        </Picker>
      </Section>
      <Section title="Mixer" symbol="slider.horizontal.3">
        <Toggle label="Show dB values" isOn={state.settings.showLevels} onIsOnChange={showLevels => session.setSettings({ showLevels })} />
        <Picker label="Text size" systemImage="textformat.size" selection={state.settings.textSize}
          onSelectionChange={textSize => session.setSettings({ textSize })} modifiers={[pickerStyle('menu')]}>
          <Text modifiers={[tag('standard')]}>Standard</Text><Text modifiers={[tag('large')]}>Large</Text><Text modifiers={[tag('larger')]}>Larger</Text>
        </Picker>
        <Button label={'Clear levels saved on this ' + (Platform.isPad ? 'iPad' : 'phone')}
          systemImage="clock.arrow.circlepath" role="destructive" onPress={clearLevels} />
      </Section>
      <Section>
        <Button label="Reset device data" role="destructive" onPress={reset.confirm} modifiers={[disabled(reset.resetting)]} />
      </Section>
      {/* What's running, centred under the list: version, update, bundle and date. */}
      <FormSection footer={<Text modifiers={[multilineTextAlignment('center'), frame({ maxWidth: 10000, alignment: 'center' }),
        foregroundStyle(theme.muted), padding({ bottom: 14 })]}>{appUpdateDetails()}</Text>} />
    </Form>
  </Host>;
}
