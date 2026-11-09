import { Pressable, Text, View } from 'react-native';
import { Icon } from './ui';
import { useTheme } from '../theme';
import type { LandscapeFaderActionsProps } from './LandscapeFaderActions';

export default function LandscapeFaderActions({ parameter, disabled, offDisabled, onModeChange, onAllOff }: LandscapeFaderActionsProps) {
  const theme = useTheme();
  const circle = { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.panel, alignItems: 'center', justifyContent: 'center' } as const;
  return <View style={{ gap: 10 }}>
    <View style={[circle, { opacity: disabled ? 0.4 : 1 }]}>
      <Icon name={{ web: 'tune' }} />
      <select aria-label="Fader mode" value={parameter} disabled={disabled} onChange={event => onModeChange(event.currentTarget.value as 'level' | 'pan')}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', colorScheme: theme.scheme }}>
        <option value="level">Level</option><option value="pan">Pan</option>
      </select>
    </View>
    <Text style={{ color: theme.muted, fontSize: 11, textAlign: 'center' }}>{parameter === 'level' ? 'Level' : 'Pan'}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Set all levels to off" disabled={offDisabled} onPress={onAllOff} style={[circle, { opacity: offDisabled ? 0.4 : 1 }]}>
      <Icon name={{ web: 'all_inclusive' }} color={theme.danger} />
    </Pressable>
  </View>;
}
