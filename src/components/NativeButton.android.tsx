import { Host, Button, TextButton, OutlinedButton, Text } from '@expo/ui/jetpack-compose';
import { useTheme } from '../theme';
import type { NativeButtonProps } from './NativeButton';
export default function NativeButton(props: NativeButtonProps) {
  const theme = useTheme();
  const Control = props.prominent ? Button : props.bordered ? OutlinedButton : TextButton;
  return <Host matchContents colorScheme={theme.scheme} seedColor={theme.tint}>
    <Control enabled={!props.disabled} onClick={props.onPress} colors={props.destructive ? { contentColor: theme.danger } : undefined}>
      <Text>{props.title}</Text>
    </Control>
  </Host>;
}
