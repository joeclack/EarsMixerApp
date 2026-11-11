import React from 'react';
import { useResetDeviceData } from './useResetDeviceData';
import ProfileCard from './ProfileCard';
import { Text, View, Switch, Platform } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { Row, Section } from './ui';
import Segmented from './Segmented';
export default function SettingsContent() {
  const { session, state, mix } = useSession(), theme = useTheme();
  const reset = useResetDeviceData();
  return <>
    <Section title="Mixer connection" symbol={{ ios: 'wifi', android: 'wifi', web: 'wifi' }} footer="Tap the mixer to change it, scan a code or enter an address.">
      <Row title={state.demo ? 'Demo mode' : state.server ? new URL(state.server).host : 'Connect to a mixer'}
        detail={state.demo ? 'Demo' : mix.status === 'connected' ? 'Connected' : mix.status === 'disconnected' ? 'Not connected' : 'Connecting…'} onPress={() => router.push('/connect')}>
        <Text style={{ color: theme.tint, fontSize: 15 }}>{state.server ? 'Change' : 'Connect'}</Text>
      </Row>
      {!state.demo && <Row title="Try demo" onPress={() => void session.startDemo()} />}
      {state.server && <Row title="Disconnect" destructive onPress={() => session.disconnect()} />}
    </Section>
    <View style={{ marginBottom: 26 }}><ProfileCard /></View>
    <Section title="Appearance" symbol={{ ios: 'circle.lefthalf.filled', android: 'contrast', web: 'contrast' }}>{Platform.OS !== 'android' && <Row title="Theme" />}
      <View style={{ padding: 12, paddingTop: Platform.OS === 'android' ? 12 : 0 }}><Segmented label="Appearance" value={state.settings.appearance}
        options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
        onChange={value => session.setSettings({ appearance: value as 'system' | 'light' | 'dark' })} /></View></Section>
    <Section title="Mixer" symbol={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }}>
      <Row title="Haptic feedback"><Switch accessibilityLabel="Haptic feedback" value={state.settings.haptics} onValueChange={haptics => session.setSettings({ haptics })} /></Row>
      <Row title="Edit channels" onPress={() => router.push('/layout')} />
    </Section>
    <Section><Row title="Reset device data" destructive onPress={reset.confirm} /></Section>
    <Section title="Developer tools" symbol={{ ios: 'wrench.and.screwdriver', android: 'build', web: 'build' }}>
      <Row title="Test first-time setup" onPress={() => void session.restartSetup()} />
      {__DEV__ && <Row title="Preview loading animation" onPress={() => router.push('/loading-preview')} />}
    </Section>
    <Section title="About" symbol={{ ios: 'info.circle', android: 'info', web: 'info' }}><Row title="EarsMixer"><Text style={{ color: theme.muted }}>{Constants.expoConfig?.version}</Text></Row></Section>
  </>;
}
