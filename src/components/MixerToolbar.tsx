import { Platform, Pressable, Text } from 'react-native';
import { router, Stack } from 'expo-router';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { Icon, styles } from './ui';

export default function MixerToolbar() {
  const { session, state, mix } = useSession();
  const theme = useTheme();
  const selected = mix.config?.aux.find(aux => aux.channel === mix.aux);
  const label = selected?.label || 'Choose mix';
  const status = mix.status === 'connected' ? 'Connected' : mix.status === 'disconnected' ? 'Disconnected' : 'Connecting';
  const color = mix.status === 'connected' ? theme.green : mix.status === 'disconnected' ? theme.danger : theme.orange;
  return <>
    <Stack.Toolbar placement="left">
      <Stack.Toolbar.View hidesSharedBackground>
        <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>Mixer</Text>
      </Stack.Toolbar.View>
    </Stack.Toolbar>
    <Stack.Toolbar placement="right" tintColor={theme.tint}>
    {Platform.OS === 'ios' ? <Stack.Toolbar.Button icon={mix.status === 'connected' ? 'wifi' : 'wifi.slash'}
      accessibilityLabel={status + '. Connect to mixer'} tintColor={color} onPress={() => router.push('/connect')} /> :
      <Stack.Toolbar.View><Pressable accessibilityRole="button" accessibilityLabel={status + '. Connect to mixer'}
        onPress={() => router.push('/connect')} style={styles.headerButton}>
        <Icon name={{ android: mix.status === 'connected' ? 'wifi' : 'wifi_off' }} color={color} />
      </Pressable></Stack.Toolbar.View>}
    {state.server && !!mix.config?.aux.length && <Stack.Toolbar.Menu icon={Platform.OS === 'ios' ? 'headphones' : undefined}
      accessibilityLabel={'Choose AUX, ' + label} disabled={mix.status !== 'connected'}>
      <Stack.Toolbar.Label>Choose AUX</Stack.Toolbar.Label>
      {mix.config.aux.map(aux => <Stack.Toolbar.MenuAction key={aux.channel} isOn={mix.aux === aux.channel}
        onPress={() => session.preferences({ selectedAux: aux.channel })}>{aux.label}</Stack.Toolbar.MenuAction>)}
    </Stack.Toolbar.Menu>}
    {state.server && <Stack.Toolbar.Menu icon={Platform.OS === 'ios' ? 'ellipsis' : undefined} accessibilityLabel="Mixer options">
      <Stack.Toolbar.Label>Options</Stack.Toolbar.Label>
      <Stack.Toolbar.MenuAction onPress={() => router.push('/templates')}>Templates</Stack.Toolbar.MenuAction>
      <Stack.Toolbar.MenuAction onPress={() => router.push('/layout')}>Edit channels</Stack.Toolbar.MenuAction>
    </Stack.Toolbar.Menu>}
    {Platform.OS === 'ios' ? <Stack.Toolbar.Button icon="gearshape" accessibilityLabel="Settings" onPress={() => router.push('/settings')} /> :
      <Stack.Toolbar.View><Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => router.push('/settings')} style={styles.headerButton}>
        <Icon name={{ android: 'settings' }} />
      </Pressable></Stack.Toolbar.View>}
  </Stack.Toolbar>
  </>;
}
