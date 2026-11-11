import React from 'react';
import Section from './HardwareSection.ios';
import { useResetDeviceData } from './useResetDeviceData';
import { Host, Form, Toggle, Picker, Text, Button, LabeledContent, VStack, HStack, Spacer, TextField, Image, useNativeState } from '@expo/ui/swift-ui';
import { font, foregroundStyle, tag, pickerStyle, buttonStyle, lineLimit, scrollContentBackground, disabled } from '@expo/ui/swift-ui/modifiers';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
export default function SettingsContent() {
  const { session, state, mix } = useSession(), theme = useTheme();
  // The mixer page has no connection control; Settings is the one place for it.
  const status = state.demo ? 'Demo' : mix.status === 'connected' ? 'Connected' : mix.status === 'disconnected' ? 'Not connected' : 'Connecting…';
  const statusColor = state.demo ? theme.orange : mix.status === 'connected' ? theme.green : mix.status === 'disconnected' ? theme.danger : theme.orange;
  const nickname = useNativeState(state.settings.nickname);
  const reset = useResetDeviceData(() => nickname.set(''));
  return <Host style={{ flex: 1 }} colorScheme={theme.scheme} seedColor={theme.tint}>
    <Form modifiers={[scrollContentBackground('hidden')]}>
      <Section title="Mixer connection" symbol="wifi" footer="Tap the mixer to change it, scan a code or enter an address.">
        <Button onPress={() => router.push('/connect')} modifiers={[buttonStyle('plain')]}>
          <HStack spacing={12}>
            <Image systemName={state.demo ? 'play.circle.fill' : mix.status === 'connected' ? 'wifi' : 'wifi.slash'} size={20} color={statusColor} />
            <VStack alignment="leading" spacing={2}>
              <Text modifiers={[lineLimit(1), font({ weight: 'semibold' })]}>{state.demo ? 'Demo mode' : state.server ? new URL(state.server).host : 'Connect to a mixer'}</Text>
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
        <TextField placeholder="Nickname" text={nickname} maxLength={80} onTextChange={value => session.setSettings({ nickname: value })} />
        {!!state.message && <Text>{state.message}</Text>}
      </Section>
      <Section title="Appearance" symbol="circle.lefthalf.filled">
        <Picker label="Appearance" systemImage="circle.lefthalf.filled" selection={state.settings.appearance}
          onSelectionChange={appearance => session.setSettings({ appearance })} modifiers={[pickerStyle('menu')]}>
          <Text modifiers={[tag('system')]}>System</Text><Text modifiers={[tag('light')]}>Light</Text><Text modifiers={[tag('dark')]}>Dark</Text>
        </Picker>
      </Section>
      <Section title="Mixer" symbol="slider.horizontal.3">
        <Toggle label="Haptic feedback" isOn={state.settings.haptics} onIsOnChange={haptics => session.setSettings({ haptics })} />
        <Button label="Edit channels" systemImage="line.3.horizontal" onPress={() => router.push('/layout')} />
      </Section>
      <Section>
        <Button label="Reset device data" role="destructive" onPress={reset.confirm} modifiers={[disabled(reset.resetting)]} />
      </Section>
      <Section title="Developer tools" symbol="wrench.and.screwdriver">
        <Button label="Test first-time setup" onPress={() => void session.restartSetup()} />
        {__DEV__ && <Button label="Preview loading animation" systemImage="slider.vertical.3" onPress={() => router.push('/loading-preview')} />}
      </Section>
      <Section title="About" symbol="info.circle">
        <LabeledContent label="EarsMixer"><Text>{Constants.expoConfig?.version || '—'}</Text></LabeledContent>
      </Section>
    </Form>
  </Host>;
}
