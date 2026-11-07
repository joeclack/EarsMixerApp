import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme';
export type SegmentProps = { value: string; options: { value: string; label: string }[]; onChange(value: string): void; label: string };
export default function Segmented({ value, options, onChange, label }: SegmentProps) {
  const theme = useTheme();
  return <View accessibilityLabel={label} style={{ flexDirection: 'row', borderRadius: 14, padding: 3, backgroundColor: theme.secondary }}>
    {options.map(item => <Pressable key={item.value} accessibilityRole="tab" accessibilityState={{ selected: value === item.value }} onPress={() => onChange(item.value)}
      style={{ flex: 1, minHeight: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 11, backgroundColor: value === item.value ? theme.panel : 'transparent' }}>
      <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{item.label}</Text>
    </Pressable>)}
  </View>;
}
