import type { SymbolViewProps } from 'expo-symbols';
import { View } from 'react-native';
import { Icon } from './ui';
import HardwarePanel from './HardwarePanel';

export default function HardwareEmblem({ name, size = 72 }: { name: SymbolViewProps['name']; size?: number }) {
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <HardwarePanel radius={size / 2} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={Math.round(size * 0.48)} />
    </HardwarePanel>
  </View>;
}
