import React from 'react';
import Section from './HardwareSection.ios';
import { useResetDeviceData } from './useResetDeviceData';
import { Host, Form, Toggle, Picker, Text, Button, LabeledContent, VStack, HStack, Spacer, TextField, useNativeState } from '@expo/ui/swift-ui';
import { foregroundStyle, tag, pickerStyle, buttonStyle, lineLimit, scrollContentBackground, disabled } from '@expo/ui/swift-ui/modifiers';
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
      <Section title="Recent states" symbol="clock">
        {!Object.keys(state.recentStates).length && <Text>No saved levels</Text>}
        {Object.entries(state.recentStates).sort(([, a], [, b]) => b.editedAt - a.editedAt).map(([key, saved]) => <VStack key={key} alignment="leading" spacing={6}>
          <Text>{saved.name}</Text>
          <Text>{new Date(saved.editedAt).toLocaleString()}</Text>
        </VStack>)}
      </Section>
      <Section title="Connection" symbol="wifi">
        <HStack spacing={12}>
          <Button systemImage={state.demo ? 'play.circle' : mix.status === 'connected' ? 'wifi' : 'wifi.slash'} onPress={() => router.push('/connect')} modifiers={[buttonStyle('borderless')]}>
            <Text modifiers={[lineLimit(1)]}>{state.demo ? 'Demo mode' : state.server ? new URL(state.server).host : 'Connect to a mixer'}</Text>
          </Button>
          <Spacer />
          <Text modifiers={[foregroundStyle(statusColor)]}>{status}</Text>
        </HStack>
        {state.server && <Button label="Disconnect" role="destructive" onPress={() => session.disconnect()} />}
        {!state.demo && <Button label="Try demo" onPress={() => void session.startDemo()} />}
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
