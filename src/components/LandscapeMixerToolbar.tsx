import { Text, View, useWindowDimensions } from 'react-native';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import LandscapeAuxPicker from './LandscapeAuxPicker';
import LandscapeFaderActions from './LandscapeFaderActions';
import { useSetAllLevelsOff } from './useSetAllLevelsOff';

export default function LandscapeMixerToolbar({ top, bottom }: { top: number; bottom: number }) {
  const { session, state, mix } = useSession(), theme = useTheme();
  const { height } = useWindowDimensions();
  const auxes = mix.config?.aux || [];
  const selected = auxes.find(aux => aux.channel === mix.aux);
  const setAllLevelsOff = useSetAllLevelsOff();
  return <View style={{ width: 76, flexShrink: 0, zIndex: 1,
    paddingTop: top, paddingBottom: bottom, alignItems: 'center', justifyContent: 'flex-start', gap: 10 }}>
    <LandscapeAuxPicker auxes={auxes} selected={mix.aux} disabled={!state.server || !auxes.length || mix.status !== 'connected'}
      onChange={selectedAux => session.preferences({ selectedAux })} />
    {height - top - bottom >= 320 && !!selected && <Text numberOfLines={3} style={{ width: 60, color: theme.muted, fontSize: 11, textAlign: 'center', lineHeight: 15 }}>{selected.label}</Text>}
    <LandscapeFaderActions parameter={mix.parameter} disabled={!state.server} offDisabled={!state.server || mix.status !== 'connected' || !mix.aux}
      onModeChange={mode => session.mixer.setParameter(mode)} onAllOff={setAllLevelsOff} />
  </View>;
}
