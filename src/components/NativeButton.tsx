import React from 'react';
import { Pressable, Text } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import { useTheme } from '../theme';
export type NativeButtonProps = { title: string; accessibilityLabel?: string; symbol?: SFSymbol; onPress(): void; prominent?: boolean; bordered?: boolean; disabled?: boolean; destructive?: boolean };
export default function NativeButton({ title, accessibilityLabel, onPress, prominent, disabled, destructive }: NativeButtonProps) {
  const theme = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
    android_ripple={{ color: theme.line }} style={({ pressed }) => ({
      minHeight: 48, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 12,
      borderRadius: 26, backgroundColor: prominent ? theme.tint : theme.panel, opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
    })}><Text style={{ fontSize: 17, fontWeight: '600', color: prominent ? '#FFFFFF' : destructive ? theme.danger : theme.tint }}>{title}</Text></Pressable>;
}
