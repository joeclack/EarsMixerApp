import React from 'react';
import { Host, Form, Section, Toggle, Picker, Text, Button, LabeledContent } from '@expo/ui/swift-ui';
import { tag, pickerStyle } from '@expo/ui/swift-ui/modifiers';
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
      <Section title="Mixer" footer={<Text>Grid view shows more channels side by side on iPad and larger screens.</Text>}>
        <Toggle label="Compact channels" systemImage="rectangle.compress.vertical" isOn={state.preferences.compact} onIsOnChange={compact => session.preferences({ compact })} />
        <Toggle label="Grid on larger screens" systemImage="square.grid.2x2" isOn={state.preferences.view === 'grid'} onIsOnChange={grid => session.preferences({ view: grid ? 'grid' : 'list' })} />
        <Toggle label="Haptic feedback" systemImage="hand.tap" isOn={state.settings.haptics} onIsOnChange={haptics => session.setSettings({ haptics })} />
        <Button label="Channel order" systemImage="line.3.horizontal" onPress={() => router.push('/layout')} />
      </Section>
      <Section title="Connection">
        <Button label={state.server ? new URL(state.server).host : 'Connect to mixer'} systemImage="wifi" onPress={() => router.push('/connect')} />
        {state.server && <Button label="Disconnect" systemImage="wifi.slash" role="destructive" onPress={() => session.disconnect()} />}
      </Section>
      <Section title="About" footer={<Text>Your mix stays on your network. Accounts and layouts are saved on your EarsMixer server.</Text>}>
        <LabeledContent label="EarsMixer"><Text>{Constants.expoConfig?.version || '—'}</Text></LabeledContent>
      </Section>
    </Form>
  </Host>;
}
