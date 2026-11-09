import { Host, Button } from '@expo/ui/swift-ui';
import { accessibilityLabel } from '@expo/ui/swift-ui/modifiers';
import { useTheme } from '../theme';
export default function CloseButton({ onPress, label = 'Close connection sheet' }: { onPress(): void; label?: string }) {
  const theme = useTheme();
  return <Host matchContents colorScheme={theme.scheme}><Button role="close" onPress={onPress} modifiers={[accessibilityLabel(label)]} /></Host>;
}
