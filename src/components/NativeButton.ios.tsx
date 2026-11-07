import React from 'react';
import { Host, Button } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize, disabled, tint, accessibilityIdentifier } from '@expo/ui/swift-ui/modifiers';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { useTheme } from '../theme';
import type { NativeButtonProps } from './NativeButton';
export default function NativeButton(props: NativeButtonProps) {
  const theme = useTheme();
  const glass = isLiquidGlassAvailable();
  return <Host matchContents colorScheme={theme.scheme}>
    <Button label={props.title} systemImage={props.symbol} role={props.destructive ? 'destructive' : 'default'} onPress={props.onPress}
      modifiers={[buttonStyle(glass ? props.prominent ? 'glassProminent' : 'glass' : props.prominent ? 'borderedProminent' : 'bordered'),
        controlSize('large'), disabled(!!props.disabled), tint(props.destructive ? theme.danger : theme.tint), accessibilityIdentifier('action-' + props.title.toLowerCase().replace(/[^a-z]+/g, '-'))]} />
  </Host>;
}
