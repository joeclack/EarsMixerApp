import React from 'react';
import { useResetDeviceData } from './useResetDeviceData';
import ProfileCard from './ProfileCard';
import { Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { Row, Section } from './ui';
import Segmented from './Segmented';
export default function SettingsContent() {
  const { session, state } = useSession(), theme = useTheme();
  const reset = useResetDeviceData();
  return <>
    <View style={{ marginBottom: 26 }}><ProfileCard /></View>
    <Section title="Appearance"><Row title="Theme" /><Segmented label="Appearance" value={state.settings.appearance}
      options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
      onChange={value => session.setSettings({ appearance: value as 'system' | 'light' | 'dark' })} /></Section>
    <Section title="Mixer">
      <Row title="Edit channels" onPress={() => router.push('/layout')} />
    </Section>
    <Section title="Connection"><View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1 }}><Row title={state.server ? new URL(state.server).host : 'Connect'} onPress={() => router.push('/connect')} /></View>
      {state.server && <Pressable accessibilityRole="button" onPress={() => session.disconnect()} style={{ minHeight: 44, paddingHorizontal: 16, justifyContent: 'center' }}>
        <Text style={{ color: theme.danger, fontSize: 15 }}>Disconnect</Text>
      </Pressable>}
    </View></Section>
    <Section><Row title="Reset device data" destructive onPress={reset.confirm} /></Section>
    <Section title="Developer tools"><Row title="Test first-time setup" onPress={() => void session.restartSetup()} /></Section>
    <Section title="About"><Row title="EarsMixer"><Text style={{ color: theme.muted }}>{Constants.expoConfig?.version}</Text></Row></Section>
  </>;
}
