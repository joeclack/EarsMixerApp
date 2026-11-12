import { useEffect } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { Message } from './ui';
import HardwareEmblem from './HardwareEmblem';
export default function ProfileCard() {
  const { session, state } = useSession(), theme = useTheme();
  useEffect(() => () => { session.restoreNickname(); }, [session]);
  return <View style={{ paddingVertical: 8, gap: 12 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <HardwareEmblem name={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }} size={40} />
      <Text style={{ color: theme.text, fontSize: 19, fontWeight: '600' }}>This device</Text>
    </View>
    <TextInput accessibilityLabel="Nickname" placeholder="Nickname" placeholderTextColor={theme.muted} maxLength={80}
      value={state.settings.nickname} onChangeText={nickname => session.setSettings({ nickname })} onBlur={() => session.restoreNickname()}
      style={{ color: theme.text, fontSize: 17, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.line }} />
    {!state.settings.nickname.trim() && <Text style={{ color: theme.muted, fontSize: 13 }}>A nickname is required. Others on your mix see it.</Text>}
    <Message error>{state.message}</Message>
  </View>;
}
