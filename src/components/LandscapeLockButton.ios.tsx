import { Platform, View } from 'react-native';
import { Host } from '@expo/ui';
import { Button, Image } from '@expo/ui/swift-ui';
import { accessibilityLabel, buttonBorderShape, buttonStyle, frame, tint } from '@expo/ui/swift-ui/modifiers';
import { useTheme } from '../theme';
import type { LandscapeLockButtonProps } from './LandscapeLockButton';
import { useToolbarHaptic } from './useToolbarHaptic';

// The same 64-point glass circle as the other rail buttons; a locked desk fills it.
export default function LandscapeLockButton({ locked, onToggle }: LandscapeLockButtonProps) {
  const theme = useTheme();
  const haptic = useToolbarHaptic();
  const glass = Number(Platform.Version) >= 26;
  return <View><Host colorScheme={theme.scheme} ignoreSafeArea="all" style={{ width: 64, height: 64 }}>
    <Button onPress={() => { haptic(); onToggle(); }}
      modifiers={[buttonStyle(locked ? (glass ? 'glassProminent' : 'borderedProminent') : (glass ? 'glass' : 'bordered')), buttonBorderShape('circle'),
        frame({ width: 64, height: 64 }), tint(theme.tint), accessibilityLabel(locked ? 'Unlock faders' : 'Lock faders')]}>
      <Image systemName={locked ? 'lock.fill' : 'lock.open'} size={22} modifiers={[frame({ width: 44, height: 44 })]} />
    </Button>
  </Host></View>;
}
