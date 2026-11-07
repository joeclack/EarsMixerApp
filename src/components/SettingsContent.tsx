import React from 'react';
import { Switch, Text } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { Row, Section } from './ui';
import Segmented from './Segmented';
export default function SettingsContent() {
  const { session, state } = useSession(), theme = useTheme();
  return <>
    <Section title="Appearance"><Row title="Theme" /><Segmented label="Appearance" value={state.settings.appearance}
      options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
      onChange={value => session.setSettings({ appearance: value as 'system' | 'light' | 'dark' })} /></Section>
    <Section title="Mixer" footer="Grid view shows more channels side by side on larger screens.">
      <Row title="Compact channels"><Switch value={state.preferences.compact} onValueChange={compact => session.preferences({ compact })} /></Row>
      <Row title="Grid on larger screens"><Switch value={state.preferences.view === 'grid'} onValueChange={grid => session.preferences({ view: grid ? 'grid' : 'list' })} /></Row>
      <Row title="Haptic feedback"><Switch value={state.settings.haptics} onValueChange={haptics => session.setSettings({ haptics })} /></Row>
      <Row title="Channel order" onPress={() => router.push('/layout')} />
    </Section>
    <Section title="Connection"><Row title={state.server ? new URL(state.server).host : 'Choose a mixer'} onPress={() => router.push('/connect')} />
      {state.server && <Row title="Disconnect" destructive onPress={() => session.disconnect()} />}
    </Section>
    <Section title="About"><Row title="EarsMixer" detail="Made for your monitor mix"><Text style={{ color: theme.muted }}>{Constants.expoConfig?.version}</Text></Row></Section>
  </>;
}
