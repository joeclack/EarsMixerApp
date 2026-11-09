import { Text, View, useWindowDimensions } from 'react-native';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import LandscapeAuxPicker from './LandscapeAuxPicker';

export default function LandscapeMixerToolbar({ top, bottom }: { top: number; bottom: number }) {
  const { session, state, mix } = useSession(), theme = useTheme();
  const { height } = useWindowDimensions();
  const auxes = mix.config?.aux || [];
  const selected = auxes.find(aux => aux.channel === mix.aux);
  return <View style={{ width: 76, flexShrink: 0, backgroundColor: theme.bg, zIndex: 1,
    paddingTop: top, paddingBottom: bottom, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
    <LandscapeAuxPicker auxes={auxes} selected={mix.aux} disabled={!state.server || !auxes.length || mix.status !== 'connected'}
      onChange={selectedAux => session.preferences({ selectedAux })} />
    {height - top - bottom >= 260 && !!selected && <Text numberOfLines={3} style={{ width: 60, color: theme.muted, fontSize: 11, textAlign: 'center', lineHeight: 15 }}>{selected.label}</Text>}
  </View>;
}
