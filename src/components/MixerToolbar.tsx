import { useSetAllLevelsOff } from './useSetAllLevelsOff';
import { Platform, Pressable } from 'react-native';
import { router, Stack } from 'expo-router';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { Icon, styles } from './ui';
import MixerHeading from './MixerHeading';

export default function MixerToolbar() {
  const { session, state, mix } = useSession();
  const theme = useTheme();
  const setAllLevelsOff = useSetAllLevelsOff();
  const selected = mix.config?.aux.find(aux => aux.channel === mix.aux);
  const label = selected?.label || 'Choose mix';
  const status = mix.status === 'connected' ? 'Connected' : mix.status === 'disconnected' ? 'Disconnected' : 'Connecting';
  const color = state.demo ? theme.orange : mix.status === 'connected' ? theme.green : mix.status === 'disconnected' ? theme.danger : theme.orange;
  return <>
    <Stack.Toolbar placement="left">
      <Stack.Toolbar.View hidesSharedBackground>
        <MixerHeading />
      </Stack.Toolbar.View>
    </Stack.Toolbar>
    <Stack.Toolbar placement="right" tintColor={theme.tint}
      backgroundColor={Platform.OS === 'android' ? theme.panel : undefined}
      buttonContainerColor={Platform.OS === 'android' ? 'transparent' : undefined}>
    {Platform.OS === 'ios' ? <Stack.Toolbar.Button icon={state.demo ? 'play.circle' : mix.status === 'connected' ? 'wifi' : 'wifi.slash'}
      accessibilityLabel={status + '. Connect to mixer'} tintColor={color} onPress={() => router.push('/connect')} /> :
      <Stack.Toolbar.View><Pressable accessibilityRole="button" accessibilityLabel={status + '. Connect to mixer'}
        onPress={() => router.push('/connect')} style={styles.headerButton}>
        <Icon name={{ android: mix.status === 'connected' ? 'wifi' : 'wifi_off' }} color={color} />
      </Pressable></Stack.Toolbar.View>}
    {state.server && !!mix.config?.aux.length && <Stack.Toolbar.Menu icon={Platform.OS === 'ios' ? 'headphones' : require('../../assets/toolbar/headphones.png')}
      accessibilityLabel={'Choose AUX, ' + label} disabled={mix.status !== 'connected'}>
      <Stack.Toolbar.Label>Choose AUX</Stack.Toolbar.Label>
      {mix.config.aux.map(aux => <Stack.Toolbar.MenuAction key={aux.channel} isOn={mix.aux === aux.channel}
        onPress={() => session.preferences({ selectedAux: aux.channel })}>{aux.label}</Stack.Toolbar.MenuAction>)}
    </Stack.Toolbar.Menu>}
    {state.server && <Stack.Toolbar.Menu icon={Platform.OS === 'ios' ? 'ellipsis' : require('../../assets/toolbar/more.png')} accessibilityLabel="Mixer options">
      <Stack.Toolbar.Label>Options</Stack.Toolbar.Label>
      <Stack.Toolbar.Menu inline title="Fader mode" icon={Platform.OS === 'ios' ? 'slider.horizontal.3' : require('../../assets/toolbar/fader-mode.png')}>
        <Stack.Toolbar.MenuAction isOn={mix.parameter === 'level'} onPress={() => session.mixer.setParameter('level')}>Level</Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction isOn={mix.parameter === 'pan'} onPress={() => session.mixer.setParameter('pan')}>Pan</Stack.Toolbar.MenuAction>
      </Stack.Toolbar.Menu>
      <Stack.Toolbar.MenuAction onPress={() => router.push('/templates')}>{state.selectedTemplate ? state.selectedTemplate.name + ': Templates' : 'Templates'}</Stack.Toolbar.MenuAction>
      <Stack.Toolbar.MenuAction onPress={() => router.push('/layout')}>Edit channels</Stack.Toolbar.MenuAction>
      <Stack.Toolbar.MenuAction onPress={() => router.push('/groups')}>Channel groups</Stack.Toolbar.MenuAction>
      <Stack.Toolbar.MenuAction destructive disabled={mix.status !== 'connected' || !mix.aux} onPress={setAllLevelsOff}>Set all levels to off</Stack.Toolbar.MenuAction>
    </Stack.Toolbar.Menu>}
    {Platform.OS === 'ios' ? <Stack.Toolbar.Button icon="gearshape" accessibilityLabel="Settings" onPress={() => router.push('/settings')} /> :
      <Stack.Toolbar.View><Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => router.push('/settings')} style={styles.headerButton}>
        <Icon name={{ android: 'settings' }} />
      </Pressable></Stack.Toolbar.View>}
  </Stack.Toolbar>
  </>;
}
