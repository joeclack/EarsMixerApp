import { Pressable, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { Icon, styles } from './ui';

export default function MixerToolbar() {
  const { session, mix } = useSession();
  const theme = useTheme();
  return <Stack.Screen options={{ headerRight: () => <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <select aria-label="Choose your mix" disabled={mix.status !== 'connected' || !mix.config?.aux.length} value={mix.aux || ''}
      onChange={event => session.preferences({ selectedAux: Number(event.target.value) })}
      style={{ color: theme.tint, background: theme.panel, border: 'none', borderRadius: 12, padding: 10, maxWidth: 180, fontSize: 15 }}>
      {!mix.config?.aux.length && <option value="">Choose mix</option>}
      {mix.config?.aux.map(aux => <option key={aux.channel} value={aux.channel}>{aux.label}</option>)}
    </select>
    <Pressable accessibilityRole="button" accessibilityLabel={(mix.status === 'connected' ? 'Connected' : 'Disconnected') + '. Connect to mixer'}
      onPress={() => router.push('/connect')} style={styles.headerButton}>
      <Icon name={{ web: mix.status === 'connected' ? 'wifi' : 'wifi_off' }} color={mix.status === 'connected' ? theme.green : theme.tint} />
    </Pressable>
  </View> }} />;
}
