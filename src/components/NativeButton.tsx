import React from 'react';
import { Pressable, Text } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import { useTheme } from '../theme';
export type NativeButtonProps = { title: string; accessibilityLabel?: string; symbol?: SFSymbol; onPress(): void; prominent?: boolean; bordered?: boolean; disabled?: boolean; destructive?: boolean; compact?: boolean; fullWidth?: boolean };
export default function NativeButton({ title, accessibilityLabel, onPress, prominent, disabled, destructive, compact, fullWidth }: NativeButtonProps) {
  const theme = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
    android_ripple={{ color: theme.line }} style={({ pressed }) => ({
      justifyContent: 'center', alignItems: 'center', paddingHorizontal: compact ? 10 : 22, paddingVertical: compact ? 6 : 12,
      borderRadius: fullWidth ? 999 : 26, alignSelf: fullWidth ? 'stretch' : undefined, minHeight: fullWidth ? 56 : compact ? 36 : 48, backgroundColor: prominent ? theme.tint : compact ? 'transparent' : theme.panel, opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
    })}><Text style={{ fontSize: compact ? 13 : 17, fontWeight: '600', color: prominent ? '#FFFFFF' : destructive ? theme.danger : theme.tint }}>{title}</Text></Pressable>;
}
