import React from 'react';
import { Text as PlainText, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { SegmentedButton, SingleChoiceSegmentedButtonRow, Switch, Text, TextButton } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding, semantics } from '@expo/ui/jetpack-compose/modifiers';
import { useResetDeviceData } from './useResetDeviceData';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { Message } from './ui';
import HardwarePanel from './HardwarePanel';
import { MaterialItem, MaterialSection, MaterialSectionTitle } from './MaterialList.android';

const appearances = [{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }] as const;

// Native Material settings in the console palette, mirroring the iOS form.
export default function SettingsContent() {
  const { session, state, mix } = useSession(), theme = useTheme();
  const reset = useResetDeviceData();
  React.useEffect(() => () => { session.restoreNickname(); }, [session]);
  return <>
    <MaterialSection title="Mixer connection" symbol="wifi" footer="Tap the mixer to change it, scan a code or enter an address.">
      <MaterialItem title={state.demo ? 'Demo mode' : state.server ? new URL(state.server).host : 'Connect to a mixer'}
        detail={state.demo ? 'Demo' : mix.status === 'connected' ? 'Connected' : state.pinPrompt ? 'PIN needed' : mix.status === 'disconnected' ? 'Not connected' : 'Connecting…'}
        symbol={state.demo ? 'play_circle' : mix.status === 'connected' ? 'wifi' : 'wifi_off'} onPress={() => router.push('/connect')}
        trailing={<TextButton onClick={() => router.push('/connect')}><Text>{state.server ? 'Change' : 'Connect'}</Text></TextButton>} />
      {!state.demo && <MaterialItem title="Try demo" symbol="play_circle" onPress={() => void session.startDemo()} />}
      {state.server && <MaterialItem title="Disconnect" symbol="link_off" destructive onPress={() => session.disconnect()} />}
    </MaterialSection>
    {/* Text entry stays a React Native field, in a card matching the sections. */}
    <View style={{ marginBottom: 24 }}>
      <MaterialSectionTitle title="This device" symbol="account_circle" />
      <HardwarePanel radius={12} style={{ paddingHorizontal: 16 }}>
        <TextInput accessibilityLabel="Nickname" placeholder="Nickname" placeholderTextColor={theme.muted} maxLength={80}
          value={state.settings.nickname} onChangeText={nickname => session.setSettings({ nickname })} onBlur={() => session.restoreNickname()}
          style={{ position: 'relative', color: theme.text, fontSize: 17, minHeight: 56, paddingVertical: 14 }} />
      </HardwarePanel>
      {!state.settings.nickname.trim() && <PlainText style={{ color: theme.muted, fontSize: 13, marginTop: 8, marginHorizontal: 16 }}>A nickname is required. Others on your mix see it.</PlainText>}
      <Message error>{state.message}</Message>
    </View>
    <MaterialSection title="Appearance" symbol="contrast">
      <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth(), padding(16, 12, 16, 12)]}>
        {appearances.map(option => <SegmentedButton key={option.value} selected={state.settings.appearance === option.value}
          onClick={() => session.setSettings({ appearance: option.value })}>
          <SegmentedButton.Label><Text>{option.label}</Text></SegmentedButton.Label>
        </SegmentedButton>)}
      </SingleChoiceSegmentedButtonRow>
    </MaterialSection>
    <MaterialSection title="Mixer" symbol="tune">
      <MaterialItem title="Haptic feedback" symbol="vibration" onPress={() => session.setSettings({ haptics: !state.settings.haptics })}
        trailing={<Switch value={state.settings.haptics} onCheckedChange={haptics => session.setSettings({ haptics })}
          modifiers={[semantics({ contentDescription: 'Haptic feedback' })]} />} />
      <MaterialItem title="Edit channels" symbol="reorder" onPress={() => router.push('/layout')} />
    </MaterialSection>
    <MaterialSection>
      <MaterialItem title="Reset device data" symbol="delete_forever" destructive onPress={reset.confirm} />
    </MaterialSection>
    <MaterialSection title="Developer tools" symbol="build">
      <MaterialItem title="Test first-time setup" symbol="restart_alt" onPress={() => void session.restartSetup()} />
      {__DEV__ && <MaterialItem title="Preview loading animation" symbol="animation" onPress={() => router.push('/loading-preview')} />}
    </MaterialSection>
    <MaterialSection title="About" symbol="info">
      <MaterialItem title="EarsMixer" symbol="headphones" trailing={<Text color={theme.muted}>{Constants.expoConfig?.version ?? ''}</Text>} />
    </MaterialSection>
  </>;
}
