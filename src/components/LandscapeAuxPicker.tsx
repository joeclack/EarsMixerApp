import { Alert, Pressable } from 'react-native';
import type { Aux } from '../mixer/model';
import { Icon } from './ui';
import { useTheme } from '../theme';

// onChange receives null for No AUX.
export type LandscapeAuxPickerProps = { auxes: Aux[]; selected: number | null; disabled: boolean; onChange(aux: number | null): void };
export default function LandscapeAuxPicker({ auxes, selected, disabled, onChange }: LandscapeAuxPickerProps) {
  const theme = useTheme();
  const label = auxes.find(aux => aux.channel === selected)?.label || 'No AUX';
  return <Pressable android_disableSound accessibilityRole="button" accessibilityLabel={'Choose AUX, ' + label} accessibilityState={{ disabled }} disabled={disabled}
    onPress={() => Alert.alert('Choose AUX', undefined, [{ text: (selected === null ? '✓ ' : '') + 'No AUX', onPress: () => onChange(null) },
      ...auxes.map(aux => ({ text: (aux.channel === selected ? '✓ ' : '') + aux.label, onPress: () => onChange(aux.channel) }))])}
    style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.panel, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1 }}>
    <Icon name={{ android: 'headphones', web: 'headphones' }} />
  </Pressable>;
}
