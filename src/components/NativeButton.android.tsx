import { Host, Button, TextButton, OutlinedButton, Text } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, semantics } from '@expo/ui/jetpack-compose/modifiers';
import { useTheme } from '../theme';
import type { NativeButtonProps } from './NativeButton';
export default function NativeButton(props: NativeButtonProps) {
  const theme = useTheme();
  const Control = props.prominent ? Button : props.bordered ? OutlinedButton : TextButton;
  const modifiers = [...(props.accessibilityLabel ? [semantics({ contentDescription: props.accessibilityLabel })] : []), ...(props.fullWidth ? [fillMaxWidth()] : [])];
  // A full-width button spans the row, matching the iOS capsule.
  return <Host matchContents={props.fullWidth ? { vertical: true } : true} colorScheme={theme.scheme} seedColor={theme.tint}
    style={props.fullWidth ? { alignSelf: 'stretch', minHeight: 56 } : undefined}>
    <Control enabled={!props.disabled} onClick={props.onPress} modifiers={modifiers.length ? modifiers : undefined} colors={props.destructive ? { contentColor: theme.danger } : undefined}>
      <Text>{props.title}</Text>
    </Control>
  </Host>;
}
