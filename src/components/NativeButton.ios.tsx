import React from 'react';
import { Host, Button, HStack, Image, Text } from '@expo/ui/swift-ui';
import { foregroundStyle, buttonBorderShape, buttonStyle, controlSize, disabled, font, frame, tint, accessibilityIdentifier, accessibilityLabel } from '@expo/ui/swift-ui/modifiers';
import { useTheme } from '../theme';
import type { NativeButtonProps } from './NativeButton';
export default function NativeButton(props: NativeButtonProps) {
  const theme = useTheme();
  const modifiers = [...(props.accessibilityLabel ? [accessibilityLabel(props.accessibilityLabel)] : []), ...(props.prominent ? [buttonStyle('borderedProminent')] : props.bordered ? [buttonStyle('bordered')] : []),
    controlSize(props.compact ? 'small' : 'large'), disabled(!!props.disabled), tint(props.destructive ? theme.danger : theme.tint), accessibilityIdentifier('action-' + props.title.toLowerCase().replace(/[^a-z]+/g, '-'))];
  // A full-width capsule stretches its label so the native bezel spans the row.
  // The pale dark-mode tint needs dark text on a prominent fill to stay legible.
  const onTint = props.prominent && theme.dark && !props.destructive ? '#062B26' : undefined;
  if (props.fullWidth) return <Host matchContents={{ vertical: true }} colorScheme={theme.scheme} style={{ alignSelf: 'stretch' }}>
    <Button role={props.destructive ? 'destructive' : 'default'} onPress={props.onPress} modifiers={[...modifiers, buttonBorderShape('capsule')]}>
      <HStack spacing={8} modifiers={[frame({ maxWidth: Infinity }), ...(onTint ? [foregroundStyle(onTint)] : [])]}>
        {!!props.symbol && <Image systemName={props.symbol} size={16} />}
        <Text modifiers={[font({ weight: 'semibold' })]}>{props.title}</Text>
      </HStack>
    </Button>
  </Host>;
  return <Host matchContents colorScheme={theme.scheme} style={{ overflow: 'hidden' }}>
    <Button label={props.title} systemImage={props.symbol} role={props.destructive ? 'destructive' : 'default'} onPress={props.onPress} modifiers={modifiers} />
  </Host>;
}
