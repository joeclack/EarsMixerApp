import { Platform, Pressable } from 'react-native';
import { router, Stack } from 'expo-router';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { Icon, styles } from './ui';

export default function MixerToolbar() {
  const { session, mix } = useSession();
  const theme = useTheme();
  const selected = mix.config?.aux.find(aux => aux.channel === mix.aux);
  const label = selected?.label || 'Choose mix';
  const status = mix.status === 'connected' ? 'Connected' : mix.status === 'disconnected' ? 'Disconnected' : 'Connecting';
  const color = mix.status === 'connected' ? theme.green : mix.status === 'disconnected' ? theme.tint : theme.orange;
  return <Stack.Toolbar placement="right" tintColor={theme.tint}>
    <Stack.Toolbar.Menu title="Choose your mix" accessibilityLabel={'Choose your mix, ' + label}
      disabled={mix.status !== 'connected' || !mix.config?.aux.length}>
      <Stack.Toolbar.Label>{label.length > 18 ? label.slice(0, 17) + '…' : label}</Stack.Toolbar.Label>
      {mix.config?.aux.map(aux => <Stack.Toolbar.MenuAction key={aux.channel} isOn={mix.aux === aux.channel}
        onPress={() => session.preferences({ selectedAux: aux.channel })}>{aux.label}</Stack.Toolbar.MenuAction>)}
    </Stack.Toolbar.Menu>
    {Platform.OS === 'ios' ? <Stack.Toolbar.Button icon={mix.status === 'connected' ? 'wifi' : 'wifi.slash'}
      accessibilityLabel={status + '. Connect to mixer'} tintColor={color} onPress={() => router.push('/connect')} /> :
      <Stack.Toolbar.View><Pressable accessibilityRole="button" accessibilityLabel={status + '. Connect to mixer'}
        onPress={() => router.push('/connect')} style={styles.headerButton}>
        <Icon name={{ android: mix.status === 'connected' ? 'wifi' : 'wifi_off' }} color={color} />
      </Pressable></Stack.Toolbar.View>}
  </Stack.Toolbar>;
}
