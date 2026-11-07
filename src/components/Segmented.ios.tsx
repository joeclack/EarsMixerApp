import React from 'react';
import { Host, Picker, Text } from '@expo/ui/swift-ui';
import { pickerStyle, tag, accessibilityLabel } from '@expo/ui/swift-ui/modifiers';
import type { SegmentProps } from './Segmented';
import { useTheme } from '../theme';
export default function Segmented({ value, options, onChange, label }: SegmentProps) {
  const theme = useTheme();
  return <Host matchContents={{ vertical: true }} style={{ width: '100%' }} colorScheme={theme.scheme}>
    <Picker selection={value} onSelectionChange={onChange} modifiers={[pickerStyle('segmented'), accessibilityLabel(label)]}>
      {options.map(item => <Text key={item.value} modifiers={[tag(item.value)]}>{item.label}</Text>)}
    </Picker>
  </Host>;
}
