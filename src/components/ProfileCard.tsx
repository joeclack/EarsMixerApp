import { Text, TextInput, View } from 'react-native';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { Icon, Message } from './ui';
export default function ProfileCard() {
  const { session, state } = useSession(), theme = useTheme();
  return <View style={{ paddingVertical: 8, gap: 12 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Icon name={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }} size={32} />
      <Text style={{ color: theme.text, fontSize: 19, fontWeight: '600' }}>This device</Text>
    </View>
    <TextInput accessibilityLabel="Nickname" placeholder="Nickname" placeholderTextColor={theme.muted} maxLength={80}
      value={state.settings.nickname} onChangeText={nickname => session.setSettings({ nickname })}
      style={{ color: theme.text, fontSize: 17, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.line }} />
    <Message error>{state.message}</Message>
  </View>;
}
