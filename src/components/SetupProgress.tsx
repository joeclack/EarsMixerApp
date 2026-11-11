import { View } from 'react-native';
import HardwarePanel from './HardwarePanel';
import { Led } from './ConsoleDetails';

// A row of indicator lamps: completed steps glow steadily, the current one pulses.
export default function SetupProgress({ step, count }: { step: number; count: number }) {
  // The adjacent step counter supplies the accessible description.
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <HardwarePanel radius={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 7 }}>
      {Array.from({ length: count }, (_, index) => <Led key={index} color="teal" size={7} on={index <= step} pulse={index === step} />)}
    </HardwarePanel>
  </View>;
}
