import { Text, View, useWindowDimensions } from 'react-native';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { Engraved } from './ConsoleDetails';

export default function MixerHeading() {
  const { state, mix } = useSession();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const selected = mix.config?.aux.find(aux => aux.channel === mix.aux);
  const subtitle = selected ? (state.demo ? 'Demo mix' : 'Monitor mix') : undefined;
  return <View accessible accessibilityRole="header" accessibilityLabel={subtitle ? `${subtitle}, ${selected!.label}` : 'Mixer'}
    style={{ maxWidth: Math.max(72, Math.min(240, width - 240)), gap: 1 }}>
    {!!subtitle && <Engraved size={9} numberOfLines={1}>{subtitle}</Engraved>}
    <Text numberOfLines={1} style={{ color: theme.text, fontSize: 20, lineHeight: 25, fontWeight: '700' }}>{selected?.label || 'Mixer'}</Text>
  </View>;
}
