import React from 'react';
import { Host, Form, Section, Toggle, Picker, Text, Button, LabeledContent, HStack, Spacer } from '@expo/ui/swift-ui';
import { tag, pickerStyle, buttonStyle, lineLimit } from '@expo/ui/swift-ui/modifiers';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
export default function SettingsContent() {
  const { session, state } = useSession(), theme = useTheme();
  return <Host style={{ flex: 1 }} colorScheme={theme.scheme} seedColor={theme.tint}>
    <Form>
      <Section title="Appearance">
        <Picker label="Appearance" systemImage="circle.lefthalf.filled" selection={state.settings.appearance}
          onSelectionChange={appearance => session.setSettings({ appearance })} modifiers={[pickerStyle('menu')]}>
          <Text modifiers={[tag('system')]}>System</Text><Text modifiers={[tag('light')]}>Light</Text><Text modifiers={[tag('dark')]}>Dark</Text>
        </Picker>
      </Section>
      <Section title="Mixer">
        <Toggle label="Compact channels" systemImage="rectangle.compress.vertical" isOn={state.preferences.compact} onIsOnChange={compact => session.preferences({ compact })} />
        <Button label="Channel order" systemImage="line.3.horizontal" onPress={() => router.push('/layout')} />
      </Section>
      <Section title="Connection">
        <HStack spacing={12}>
          <Button systemImage="wifi" onPress={() => router.push('/connect')} modifiers={[buttonStyle('borderless')]}>
            <Text modifiers={[lineLimit(1)]}>{state.server ? new URL(state.server).host : 'Connect'}</Text>
          </Button>
          <Spacer />
          {state.server && <Button label="Disconnect" role="destructive" modifiers={[buttonStyle('borderless')]} onPress={() => session.disconnect()} />}
        </HStack>
      </Section>
      <Section title="About">
        <LabeledContent label="EarsMixer"><Text>{Constants.expoConfig?.version || '—'}</Text></LabeledContent>
      </Section>
    </Form>
  </Host>;
}
