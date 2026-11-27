import React, { useEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme';
export type SegmentProps<T extends string = string> = { value: T; options: readonly { value: T; label: string }[]; onChange(value: T): void; label: string };
export default function Segmented<T extends string>({ value, options, onChange, label }: SegmentProps<T>) {
  const theme = useTheme();
  const android = Platform.OS === 'android';
  const radius = android ? 999 : 11;
  return <View accessibilityRole="tablist" accessibilityLabel={label}
    style={{ flexDirection: 'row', borderRadius: android ? radius : 14, padding: 3, backgroundColor: theme.secondary }}>
    {options.map(item => <View key={item.value} style={{ flex: 1, minWidth: 0, borderRadius: radius, overflow: android ? 'hidden' : 'visible' }}>
      <Pressable android_disableSound accessibilityRole="tab" accessibilityState={{ selected: value === item.value }} onPress={() => onChange(item.value)}
        style={({ pressed }) => ({ flex: 1, minHeight: android ? 48 : 36, justifyContent: 'center', alignItems: 'center',
          paddingHorizontal: android ? 6 : 0, opacity: pressed ? 0.8 : 1 })}>
        <Selection selected={value === item.value} color={theme.panel} radius={radius} />
        <Text numberOfLines={android ? 1 : undefined} adjustsFontSizeToFit={android}
          style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{item.label}</Text>
      </Pressable>
    </View>)}
  </View>;
}

function Selection({ selected, color, radius }: { selected: boolean; color: string; radius: number }) {
  const opacity = useSharedValue(selected ? 1 : 0);
  useEffect(() => { opacity.value = withTiming(selected ? 1 : 0, { duration: 140, reduceMotion: ReduceMotion.System }); }, [selected, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', inset: 0, borderRadius: radius, backgroundColor: color }, style]} />;
}
