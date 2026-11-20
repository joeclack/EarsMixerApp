import { useSetAllLevelsOff } from './useSetAllLevelsOff';
import { Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import AuxSelector from './AuxSelector';

export default function MixerToolbar() {
  const { session, state, mix } = useSession();
  const theme = useTheme();
  const setAllLevelsOff = useSetAllLevelsOff();
  const selected = mix.config?.aux.find(aux => aux.channel === mix.aux);
  const label = selected?.label || 'Choose mix';
  const pad = Platform.OS === 'ios' && Platform.isPad;
  const offDisabled = mix.status !== 'connected' || !mix.aux || mix.locked;
  const modeActions = [
    <Stack.Toolbar.MenuAction key="level" icon="speaker.wave.2" isOn={mix.parameter === 'level'} onPress={() => session.mixer.setParameter('level')}>Level</Stack.Toolbar.MenuAction>,
    <Stack.Toolbar.MenuAction key="pan" icon="arrow.left.and.right" isOn={mix.parameter === 'pan'} onPress={() => session.mixer.setParameter('pan')}>Pan</Stack.Toolbar.MenuAction>,
  ];
  const otherActions = [
    // Channels, groups and templates live in the Channels tab, and Settings in its own tab.
    <Stack.Toolbar.MenuAction key="request" disabled={mix.status !== 'connected'} onPress={() => router.push('/request')}>Message the engineer</Stack.Toolbar.MenuAction>,
  ];
  // iPad shows Lock and Set all levels to off as their own toolbar buttons. On
  // iPhone they share a row of icons at the bottom of the menu.
  const quickActions = pad ? [] : [
    <Stack.Toolbar.MenuAction key="lock" icon={mix.locked ? 'lock.fill' : 'lock.open'} isOn={mix.locked}
      onPress={() => session.mixer.setLocked(!mix.locked)}>{mix.locked ? 'Unlock faders' : 'Lock faders'}</Stack.Toolbar.MenuAction>,
    <Stack.Toolbar.MenuAction key="off" icon="infinity" destructive disabled={offDisabled} onPress={setAllLevelsOff}>Set all levels to off</Stack.Toolbar.MenuAction>,
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
    {/* iPad has room for Fader mode as its own toolbar item. */}
    {pad && state.server && <Stack.Toolbar.Menu icon="slider.horizontal.3" accessibilityLabel={'Fader mode, ' + (mix.parameter === 'pan' ? 'Pan' : 'Level')}>
      <Stack.Toolbar.Label>Fader mode</Stack.Toolbar.Label>
      {modeActions}
    </Stack.Toolbar.Menu>}
    {pad && state.server && <Stack.Toolbar.Button icon={mix.locked ? 'lock.fill' : 'lock.open'} selected={mix.locked}
      accessibilityLabel={mix.locked ? 'Unlock faders' : 'Lock faders'} onPress={() => session.mixer.setLocked(!mix.locked)} />}
    {pad && state.server && <Stack.Toolbar.Button icon="infinity" tintColor={theme.danger} accessibilityLabel="Set all levels to off"
      disabled={offDisabled} onPress={setAllLevelsOff} />}
    {state.server && <Stack.Toolbar.Menu icon={Platform.OS === 'ios' ? 'ellipsis' : require('../../assets/toolbar/more.png')} accessibilityLabel="Mixer options">
      <Stack.Toolbar.Label>Options</Stack.Toolbar.Label>
      {pad ? null : Platform.OS === 'android' ? modeActions : <Stack.Toolbar.Menu inline palette title="Fader mode" icon="slider.horizontal.3">
        {modeActions}
      </Stack.Toolbar.Menu>}
      {Platform.OS === 'android' ? <Stack.Toolbar.Menu inline title="Options">
        {otherActions}{quickActions}
      </Stack.Toolbar.Menu> : otherActions}
      {Platform.OS !== 'android' && quickActions.length > 0 && <Stack.Toolbar.Menu inline palette>
        {quickActions}
      </Stack.Toolbar.Menu>}
    </Stack.Toolbar.Menu>}
  </Stack.Toolbar>
  </>;
}
