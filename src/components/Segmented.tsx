import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme';
export type SegmentProps = { value: string; options: { value: string; label: string }[]; onChange(value: string): void; label: string };
export default function Segmented({ value, options, onChange, label }: SegmentProps) {
  const theme = useTheme();
  return <View accessibilityLabel={label} style={{ flexDirection: 'row', borderRadius: 14, padding: 3, backgroundColor: theme.secondary }}>
    {options.map(item => <Pressable key={item.value} accessibilityRole="tab" accessibilityState={{ selected: value === item.value }} onPress={() => onChange(item.value)}
      style={({ pressed }) => ({ flex: 1, minHeight: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 11, opacity: pressed ? 0.8 : 1 })}>
      <Selection selected={value === item.value} color={theme.panel} />
      <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{item.label}</Text>
    </Pressable>)}
  </View>;
}

function Selection({ selected, color }: { selected: boolean; color: string }) {
  const opacity = useSharedValue(selected ? 1 : 0);
  useEffect(() => { opacity.value = withTiming(selected ? 1 : 0, { duration: 140, reduceMotion: ReduceMotion.System }); }, [selected, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', inset: 0, borderRadius: 11, backgroundColor: color }, style]} />;
}
