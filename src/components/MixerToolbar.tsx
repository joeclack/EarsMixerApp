import { useSetAllLevelsOff } from './useSetAllLevelsOff';
import { Platform, Pressable } from 'react-native';
import { router, Stack } from 'expo-router';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import AuxSelector from './AuxSelector';
import { Icon, styles } from './ui';

export default function MixerToolbar() {
  const { session, state, mix } = useSession();
  const theme = useTheme();
  const setAllLevelsOff = useSetAllLevelsOff();
  const selected = mix.config?.aux.find(aux => aux.channel === mix.aux);
  const label = selected?.label || 'Choose mix';
  const pad = Platform.OS === 'ios' && Platform.isPad;
  const modeActions = [
    <Stack.Toolbar.MenuAction key="level" isOn={mix.parameter === 'level'} onPress={() => session.mixer.setParameter('level')}>Level</Stack.Toolbar.MenuAction>,
    <Stack.Toolbar.MenuAction key="pan" isOn={mix.parameter === 'pan'} onPress={() => session.mixer.setParameter('pan')}>Pan</Stack.Toolbar.MenuAction>,
  ];
  const otherActions = [
    <Stack.Toolbar.MenuAction key="request" disabled={mix.status !== 'connected'} onPress={() => router.push('/request')}>Message the engineer</Stack.Toolbar.MenuAction>,
    <Stack.Toolbar.MenuAction key="templates" onPress={() => router.push('/templates')}>{state.selectedTemplate ? state.selectedTemplate.name + ': Templates' : 'Templates'}</Stack.Toolbar.MenuAction>,
    <Stack.Toolbar.MenuAction key="layout" onPress={() => router.push('/layout')}>Edit channels</Stack.Toolbar.MenuAction>,
    <Stack.Toolbar.MenuAction key="groups" onPress={() => router.push('/groups')}>Channel groups</Stack.Toolbar.MenuAction>,
    <Stack.Toolbar.MenuAction key="lock" isOn={mix.locked} onPress={() => session.mixer.setLocked(!mix.locked)}>Lock faders</Stack.Toolbar.MenuAction>,
    <Stack.Toolbar.MenuAction key="off" destructive disabled={mix.status !== 'connected' || !mix.aux || mix.locked} onPress={setAllLevelsOff}>Set all levels to off</Stack.Toolbar.MenuAction>,
  ];
  return <>
    <Stack.Toolbar placement="left">
      <Stack.Toolbar.View hidesSharedBackground>
        <AuxSelector />
      </Stack.Toolbar.View>
    </Stack.Toolbar>
    <Stack.Toolbar placement="right" tintColor={theme.tint}
      backgroundColor={Platform.OS === 'android' ? theme.panel : undefined}
      buttonContainerColor={Platform.OS === 'android' ? 'transparent' : undefined}>
    {/* On iOS the AUX is chosen from the leading selector. */}
    {Platform.OS !== 'ios' && state.server && !!mix.config?.aux.length && <Stack.Toolbar.Menu icon={require('../../assets/toolbar/headphones.png')}
      accessibilityLabel={'Choose AUX, ' + label} disabled={mix.status !== 'connected'}>
      <Stack.Toolbar.Label>Choose AUX</Stack.Toolbar.Label>
      {mix.config.aux.map(aux => <Stack.Toolbar.MenuAction key={aux.channel} isOn={mix.aux === aux.channel}
        onPress={() => session.preferences({ selectedAux: aux.channel })}>{aux.label}</Stack.Toolbar.MenuAction>)}
    </Stack.Toolbar.Menu>}
    {/* Mixer options and Settings share one glass group, leaving room for a long AUX name. */}
    {/* iPad has room for Fader mode as its own toolbar item. */}
    {pad && state.server && <Stack.Toolbar.Menu icon="slider.horizontal.3" accessibilityLabel={'Fader mode, ' + (mix.parameter === 'pan' ? 'Pan' : 'Level')}>
      <Stack.Toolbar.Label>Fader mode</Stack.Toolbar.Label>
      {modeActions}
    </Stack.Toolbar.Menu>}
    {state.server && <Stack.Toolbar.Menu icon={Platform.OS === 'ios' ? 'ellipsis' : require('../../assets/toolbar/more.png')} accessibilityLabel="Mixer options">
      <Stack.Toolbar.Label>Options</Stack.Toolbar.Label>
      {pad ? null : Platform.OS === 'android' ? modeActions : <Stack.Toolbar.Menu inline title="Fader mode" icon="slider.horizontal.3">
        {modeActions}
      </Stack.Toolbar.Menu>}
      {Platform.OS === 'android' ? <Stack.Toolbar.Menu inline title="Options">
        {otherActions}
      </Stack.Toolbar.Menu> : otherActions}
    </Stack.Toolbar.Menu>}
    {Platform.OS === 'ios' ? <Stack.Toolbar.Button icon="gearshape" accessibilityLabel="Settings" onPress={() => router.push('/settings')} /> :
      <Stack.Toolbar.View><Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => router.push('/settings')} style={styles.headerButton}>
        <Icon name={{ android: 'settings' }} />
      </Pressable></Stack.Toolbar.View>}
  </Stack.Toolbar>
  </>;
}
