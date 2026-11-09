import { View } from 'react-native';
import { Icon } from './ui';
import { useTheme } from '../theme';
import type { LandscapeAuxPickerProps } from './LandscapeAuxPicker';

export default function LandscapeAuxPicker({ auxes, selected, disabled, onChange }: LandscapeAuxPickerProps) {
  const theme = useTheme();
  return <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.panel, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1 }}>
    <Icon name={{ web: 'headphones' }} />
    <select aria-label={'Choose AUX, ' + (auxes.find(aux => aux.channel === selected)?.label || 'Choose mix')} value={selected ?? ''} disabled={disabled}
      onChange={event => onChange(Number(event.currentTarget.value))}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', colorScheme: theme.scheme }}>
      <option value="" disabled>Choose mix</option>
      {auxes.map(aux => <option key={aux.channel} value={aux.channel}>{aux.label}</option>)}
    </select>
  </View>;
}
