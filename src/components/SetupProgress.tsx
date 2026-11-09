import { View } from 'react-native';
import { useTheme } from '../theme';
import HardwarePanel from './HardwarePanel';
import { hardwarePalette } from './hardwarePalette';

export default function SetupProgress({ step, count }: { step: number; count: number }) {
  const { dark } = useTheme(), palette = hardwarePalette(dark);
  // The adjacent step counter supplies the accessible description.
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <HardwarePanel radius={10} style={{ flexDirection: 'row', gap: 5, padding: 9 }}>
      {Array.from({ length: count }, (_, index) => <View key={index} style={{ width: 14, height: 4, borderRadius: 2,
        backgroundColor: index <= step ? palette.indicator : palette.slot, opacity: index < step ? 0.5 : 1 }} />)}
    </HardwarePanel>
  </View>;
}
