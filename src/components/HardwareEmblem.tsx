import type { SymbolViewProps } from 'expo-symbols';
import { View } from 'react-native';
import { Icon } from './ui';
import HardwarePanel from './HardwarePanel';
import { CornerScrews } from './ConsoleDetails';

// A screwed-down faceplate at larger sizes; small emblems stay a simple disc.
export default function HardwareEmblem({ name, size = 72 }: { name: SymbolViewProps['name']; size?: number }) {
  const plate = size >= 64;
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <HardwarePanel radius={plate ? 18 : size / 2} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={Math.round(size * (plate ? 0.42 : 0.48))} />
      {plate && <CornerScrews inset={7} size={6} />}
    </HardwarePanel>
  </View>;
}
