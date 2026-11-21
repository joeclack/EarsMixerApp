import { Pressable } from 'react-native';
import { Icon } from './ui';
import { useTheme } from '../theme';

export type LandscapeLockButtonProps = { locked: boolean; onToggle(): void };

// The same 48-point circle as the other rail buttons; a locked desk fills it.
export default function LandscapeLockButton({ locked, onToggle }: LandscapeLockButtonProps) {
  const theme = useTheme();
  return <Pressable accessibilityRole="switch" accessibilityLabel="Lock faders" accessibilityState={{ checked: locked }} onPress={onToggle}
    style={({ pressed }) => ({ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
      backgroundColor: locked ? theme.tint : theme.panel, opacity: pressed ? 0.7 : 1 })}>
    <Icon name={{ ios: locked ? 'lock.fill' : 'lock.open', android: locked ? 'lock' : 'lock_open', web: locked ? 'lock' : 'lock_open' }} size={20} color={locked ? theme.panel : theme.tint} />
  </Pressable>;
}
