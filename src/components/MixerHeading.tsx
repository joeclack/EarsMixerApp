import { Text, View, useWindowDimensions } from 'react-native';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';

export default function MixerHeading() {
  const { state, mix } = useSession();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const selected = mix.config?.aux.find(aux => aux.channel === mix.aux);
  const subtitle = selected ? (state.demo ? 'Demo mix' : 'Monitor mix') : undefined;
  return <View accessible accessibilityRole="header" accessibilityLabel={subtitle ? `${subtitle}, ${selected!.label}` : 'Mixer'}
    style={{ maxWidth: Math.max(72, Math.min(240, width - 240)), gap: 1 }}>
    {!!subtitle && <Text numberOfLines={1} style={{ color: theme.muted, fontSize: 10, lineHeight: 13, fontWeight: '500' }}>{subtitle}</Text>}
    <Text numberOfLines={1} style={{ color: theme.text, fontSize: 20, lineHeight: 25, fontWeight: '700' }}>{selected?.label || 'Mixer'}</Text>
  </View>;
}
