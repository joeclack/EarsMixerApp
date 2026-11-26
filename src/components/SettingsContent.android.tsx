import React from 'react';
import { Text as PlainText, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { appUpdateDetails } from '../appVersion';
import { Switch, Text, TextButton } from '@expo/ui/jetpack-compose';
import { semantics } from '@expo/ui/jetpack-compose/modifiers';
import { useResetDeviceData } from './useResetDeviceData';
import { useClearSavedLevels } from './useClearSavedLevels';
import { useSession } from '../mixer/context';
import { mixerLabel } from '../connection';
import { useTheme } from '../theme';
import { Message } from './ui';
import FieldSurface from './FieldSurface';
import { MaterialItem, MaterialSection, MaterialSectionTitle } from './MaterialList.android';
import Segmented from './Segmented';

const appearances = [{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }] as const;
const textSizes = [{ value: 'standard', label: 'Standard' }, { value: 'large', label: 'Large' }, { value: 'larger', label: 'Larger' }] as const;

// Native Material settings in the console palette, mirroring the iOS form.
export default function SettingsContent() {
  const { session, state, mix } = useSession(), theme = useTheme();
  const reset = useResetDeviceData();
  const clearLevels = useClearSavedLevels();
  React.useEffect(() => () => { session.restoreNickname(); }, [session]);
  return <>
    <MaterialSection title="Mixer connection" symbol="wifi" footer="Tap the mixer to change it, scan a code or enter an address.">
      <MaterialItem title={state.demo ? 'Demo mode' : state.server ? mixerLabel(state.server, state.recent) : 'Connect to a mixer'}
        detail={state.demo ? 'Demo' : mix.status === 'connected' ? 'Connected' : state.pinPrompt ? 'PIN needed' : mix.status === 'disconnected' ? 'Not connected' : 'Connecting…'}
        symbol={state.demo ? 'play_circle' : mix.status === 'connected' ? 'wifi' : 'wifi_off'} onPress={() => router.push('/connect')}
        trailing={<TextButton onClick={() => router.push('/connect')}><Text>{state.server ? 'Change' : 'Connect'}</Text></TextButton>} />
      {!state.demo && <MaterialItem title="Try demo" symbol="play_circle" onPress={() => void session.startDemo()} />}
      {state.server && <MaterialItem title="Disconnect" symbol="link_off" destructive onPress={() => session.disconnect()} />}
    </MaterialSection>
    <View style={{ marginBottom: 24 }}>
      <MaterialSectionTitle title="This device" symbol="account_circle" />
      <FieldSurface>
        <TextInput accessibilityLabel="Nickname" placeholder="Nickname" placeholderTextColor={theme.muted} maxLength={80}
          value={state.settings.nickname} onChangeText={nickname => session.setSettings({ nickname })} onBlur={() => session.restoreNickname()}
          style={{ position: 'relative', color: theme.text, fontSize: 17, minHeight: 56, paddingVertical: 14 }} />
      </FieldSurface>
      {!state.settings.nickname.trim() && <PlainText style={{ color: theme.muted, fontSize: 13, marginTop: 8, marginHorizontal: 16 }}>A nickname is required. Others on your mix see it.</PlainText>}
      <Message error>{state.message}</Message>
    </View>
    <View style={{ marginBottom: 24 }}>
      <MaterialSectionTitle title="Appearance" symbol="contrast" />
      <Segmented label="Appearance" value={state.settings.appearance} options={appearances} onChange={appearance => session.setSettings({ appearance })} />
    </View>
    <MaterialSection title="Mixer" symbol="tune">
      <MaterialItem title="Show dB values" symbol="tag" onPress={() => session.setSettings({ showLevels: !state.settings.showLevels })}
        trailing={<Switch value={state.settings.showLevels} onCheckedChange={showLevels => session.setSettings({ showLevels })}
          modifiers={[semantics({ contentDescription: 'Show dB values' })]} />} />
      <MaterialItem title="Clear levels saved on this device" symbol="history" destructive onPress={clearLevels} />
    </MaterialSection>
    <View style={{ marginBottom: 24 }}>
      <MaterialSectionTitle title="Text size" symbol="format_size" />
      <Segmented label="Text size" value={state.settings.textSize} options={textSizes} onChange={textSize => session.setSettings({ textSize })} />
    </View>
    <MaterialSection>
      <MaterialItem title="Reset device data" symbol="delete_forever" destructive onPress={reset.confirm} />
    </MaterialSection>
    {/* What's running, centred under the list: version, update, bundle and date. */}
    <PlainText style={{ color: theme.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 4, marginHorizontal: 16 }}>{appUpdateDetails()}</PlainText>
  </>;
}
