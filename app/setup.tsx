import { SafeAreaProvider } from 'react-native-safe-area-context';
import SetupWalkthrough from '../src/components/SetupWalkthrough';
export default function Setup() {
  // The full-screen modal needs insets measured in its own native view.
  return <SafeAreaProvider><SetupWalkthrough /></SafeAreaProvider>;
}
