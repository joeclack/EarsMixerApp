import { Alert, Pressable, Text, View } from 'react-native';
import type { Parameter } from '../mixer/model';
import { Icon } from './ui';
import { useTheme } from '../theme';

export type LandscapeFaderActionsProps = { parameter: Parameter; disabled: boolean; offDisabled: boolean; onModeChange(mode: Parameter): void; onAllOff(): void };
export default function LandscapeFaderActions({ parameter, disabled, offDisabled, onModeChange, onAllOff }: LandscapeFaderActionsProps) {
  const theme = useTheme();
  return <View style={{ gap: 10 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={'Fader mode, ' + parameter} disabled={disabled}
      onPress={() => Alert.alert('Fader mode', undefined, [
        { text: (parameter === 'level' ? '✓ ' : '') + 'Level', onPress: () => onModeChange('level') },
        { text: (parameter === 'pan' ? '✓ ' : '') + 'Pan', onPress: () => onModeChange('pan') }, { text: 'Cancel', style: 'cancel' },
      ])} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.panel, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1 }}>
      <Icon name={{ android: 'tune', web: 'tune' }} />
    </Pressable>
    <Text style={{ color: theme.muted, fontSize: 11, textAlign: 'center' }}>{parameter === 'level' ? 'Level' : 'Pan'}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Set all levels to off" disabled={offDisabled} onPress={onAllOff}
      style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.panel, alignItems: 'center', justifyContent: 'center', opacity: offDisabled ? 0.4 : 1 }}>
      <Icon name={{ android: 'all_inclusive', web: 'all_inclusive' }} color={theme.danger} />
    </Pressable>
  </View>;
}
