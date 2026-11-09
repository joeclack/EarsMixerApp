import React from 'react';
import { Host, Button } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize, disabled, tint, accessibilityIdentifier, accessibilityLabel } from '@expo/ui/swift-ui/modifiers';
import { useTheme } from '../theme';
import type { NativeButtonProps } from './NativeButton';
export default function NativeButton(props: NativeButtonProps) {
  const theme = useTheme();
  return <Host matchContents colorScheme={theme.scheme} style={{ overflow: 'hidden' }}>
    <Button label={props.title} systemImage={props.symbol} role={props.destructive ? 'destructive' : 'default'} onPress={props.onPress}
      modifiers={[...(props.accessibilityLabel ? [accessibilityLabel(props.accessibilityLabel)] : []), ...(props.prominent ? [buttonStyle('borderedProminent')] : props.bordered ? [buttonStyle('bordered')] : []),
        controlSize(props.compact ? 'small' : 'large'), disabled(!!props.disabled), tint(props.destructive ? theme.danger : theme.tint), accessibilityIdentifier('action-' + props.title.toLowerCase().replace(/[^a-z]+/g, '-'))]} />
  </Host>;
}
