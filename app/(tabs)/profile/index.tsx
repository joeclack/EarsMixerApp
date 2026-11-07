import React, { useEffect, useState } from 'react';
import { Alert, Keyboard, Platform, Text, TextInput, View } from 'react-native';
import { useSession } from '../../../src/mixer/context';
import { useTheme } from '../../../src/theme';
import { Page, Section, Row, EmptyMixer, Glass, Icon, Message } from '../../../src/components/ui';
import NativeButton from '../../../src/components/NativeButton';
import Segmented from '../../../src/components/Segmented';
import type { Sync } from '../../../src/mixer/session';

const messages: Record<Sync, string> = {
  guest: 'Guest layout · saved on this device', saved: 'Your layout is up to date', saving: 'Saving your layout…',
  pending: 'Layout changes waiting to save', conflict: 'This layout changed on another device',
  error: 'Your layout needs to be synced', unavailable: 'Account service is unavailable',
};
export default function Profile() {
  const { session, state } = useSession(), theme = useTheme();
  const [register, setRegister] = useState(false), [username, setUsername] = useState(''), [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(''), [error, setError] = useState('');
  useEffect(() => { setDisplayName(state.user?.displayName || ''); setPassword(''); setError(''); }, [state.user?.id]);
  const action = async (fn: () => Promise<void>) => {
    setError('');
    try { await fn(); Keyboard.dismiss(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Please try again.'); }
  };
  const input = { color: theme.text, fontSize: 17, minHeight: 52, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: theme.line };
  return <Page title="Profile">
    {!state.server ? <EmptyMixer profile /> : <>
      <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 26, gap: 12 }}>
        <Glass style={{ width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={{ ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' }} size={64} />
        </Glass>
        <Text style={{ color: theme.text, fontSize: 26, fontWeight: '700' }}>{state.user?.displayName || 'Your personal mix'}</Text>
        <Text style={{ color: theme.muted, fontSize: 15 }}>{state.user ? '@' + state.user.username : 'Your name. Your channels. Your layout.'}</Text>
      </View>
      {state.user ? <>
        <Section title="Personal information">
          <Text style={{ color: theme.muted, paddingHorizontal: 16, paddingTop: 13, fontSize: 13 }}>Display name</Text>
          <TextInput accessibilityLabel="Display name" value={displayName} onChangeText={setDisplayName} maxLength={80} autoComplete="nickname" style={input} />
          <View style={{ padding: 12, alignItems: 'flex-start' }}><NativeButton title="Save name" disabled={state.busy || !displayName.trim()} onPress={() => void action(() => session.rename(displayName))} /></View>
        </Section>
        <Section title="Saved layout" footer="Channel order, favourites, selected mix and view settings follow your account. Audio levels are never recalled.">
          <Row title={messages[state.sync]} detail={state.sync === 'conflict' ? 'Load the server copy, or choose to replace it with this layout.' : 'Saved on ' + new URL(state.server).host}>
            <Icon name={{ ios: state.sync === 'saved' ? 'checkmark.icloud' : 'icloud.and.arrow.up', android: 'cloud_done', web: 'cloud_done' }} color={state.sync === 'conflict' ? theme.orange : theme.tint} />
          </Row>
          <View style={{ padding: 12, gap: 10, flexDirection: 'row', flexWrap: 'wrap' }}>
            <NativeButton title={state.sync === 'conflict' ? 'Keep this layout' : 'Save now'} prominent disabled={state.busy || state.sync === 'saving'} onPress={() => void action(() => session.save(true))} />
            <NativeButton title="Load saved" disabled={state.busy || state.sync === 'saving'} onPress={() => void action(() => session.loadSaved())} />
          </View>
        </Section>
        <NativeButton title="Sign out" symbol="rectangle.portrait.and.arrow.right" destructive disabled={state.busy || state.sync === 'saving'}
          onPress={() => {
            if (Platform.OS === 'web') void action(() => session.logout());
            else Alert.alert('Sign out?', 'Your guest layout will be restored on this device.', [
              { text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: () => void action(() => session.logout()) },
            ]);
          }} />
      </> : <>
        <View style={{ marginBottom: 20 }}><Segmented label="Account action" value={register ? 'register' : 'login'} onChange={value => { setRegister(value === 'register'); setError(''); }}
          options={[{ value: 'login', label: 'Sign in' }, { value: 'register', label: 'Create account' }]} /></View>
        <Section footer={register ? 'Your current layout will be saved to your new account on this mixer.' : 'Use the same account as the EarsMixer web app.'}>
          {register && <TextInput accessibilityLabel="Display name" placeholder="Your name" placeholderTextColor={theme.muted} value={displayName} onChangeText={setDisplayName} autoComplete="nickname" maxLength={80} style={input} />}
          <TextInput accessibilityLabel="Username" placeholder="Username" placeholderTextColor={theme.muted} value={username} onChangeText={setUsername}
            autoCapitalize="none" autoCorrect={false} autoComplete="username" textContentType="username" maxLength={32} style={input} />
          <TextInput accessibilityLabel="Password" placeholder="Password" placeholderTextColor={theme.muted} value={password} onChangeText={setPassword}
            secureTextEntry autoComplete={register ? 'new-password' : 'current-password'} textContentType={register ? 'newPassword' : 'password'} maxLength={128} style={{ ...input, borderBottomWidth: 0 }} />
        </Section>
        <NativeButton title={state.busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'} symbol={register ? 'person.crop.circle.badge.plus' : 'person.crop.circle'}
          prominent disabled={state.busy || username.trim().length < 3 || password.length < 8} onPress={() => void action(async () => {
            await session.authenticate(username.trim(), password, register, displayName); setPassword('');
          })} />
        <Message>Forgot your password? Your mixer administrator can reset it while keeping your saved layout.</Message>
      </>}
      <Message error>{error}</Message>
      <Message>{state.message}</Message>
    </>}
  </Page>;
}
