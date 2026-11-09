import { Host, Button } from '@expo/ui/swift-ui';
import { accessibilityLabel, buttonStyle, frame, labelStyle, tint } from '@expo/ui/swift-ui/modifiers';
import { useTheme } from '../theme';
export default function CloseButton({ onPress, label = 'Close connection sheet' }: { onPress(): void; label?: string }) {
  const theme = useTheme();
  return <Host matchContents colorScheme={theme.scheme}>
    <Button label="Close" systemImage="xmark" onPress={onPress}
      modifiers={[labelStyle('iconOnly'), buttonStyle('plain'), tint(theme.tint), frame({ width: 44, height: 44 }), accessibilityLabel(label)]} />
  </Host>;
}
