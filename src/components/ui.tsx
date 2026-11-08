import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View, type ViewProps, type ColorValue } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { router, Stack } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useTheme } from '../theme';
import { useSession } from '../mixer/context';
import NativeButton from './NativeButton';

export function Icon({ name, size = 22, color }: { name: SymbolViewProps['name']; size?: number; color?: ColorValue }) {
  const theme = useTheme();
  return <SymbolView name={name} size={size} tintColor={color || theme.tint} style={{ width: size, height: size }} />;
}
export function Glass({ children, style, ...props }: ViewProps) {
  const theme = useTheme();
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    void AccessibilityInfo.isReduceTransparencyEnabled().then(setReduced);
    const listener = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduced);
    return () => listener.remove();
  }, []);
  if (Platform.OS === 'ios' && isLiquidGlassAvailable() && !reduced)
    return <GlassView glassEffectStyle="regular" colorScheme={theme.scheme} style={style} {...props}>{children}</GlassView>;
  return <View style={[{ backgroundColor: theme.panel }, style]} {...props}>{children}</View>;
}
export function Page({ title, children, scroll = true, compactHeader = true, toolbar }: React.PropsWithChildren<{ title: string; scroll?: boolean; compactHeader?: boolean; toolbar?: React.ReactNode }>) {
  const theme = useTheme();
  const { state, mix } = useSession();
  const headerHeight = useHeaderHeight();
  const options = {
    title, headerLargeTitleEnabled: !compactHeader, headerTransparent: Platform.OS === 'ios',
    headerTitleStyle: { color: theme.text },
    ...(toolbar && { title: '', headerTitle: '', headerBackVisible: false,
      ...(Platform.OS === 'web' && { headerLeft: () => <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>{title}</Text> }) }),
    headerShadowVisible: false, headerLargeTitleShadowVisible: false, headerTintColor: theme.tint,
    headerStyle: { backgroundColor: 'transparent' },
    ...(!toolbar && { headerRight: () => <Pressable accessibilityRole="button" accessibilityLabel="Connect to mixer" onPress={() => router.push('/connect')} style={styles.headerButton}>
      <Icon name={{ ios: mix.status === 'connected' ? 'wifi' : 'wifi.slash', android: 'wifi', web: 'wifi' }} color={mix.status === 'connected' ? theme.green : theme.tint} />
    </Pressable> }),
  };
  return <View style={{ flex: 1, backgroundColor: theme.bg }}>
    <Stack.Screen options={options} />
    {toolbar}
    {scroll ? <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets
      contentContainerStyle={styles.page}>{children}</ScrollView> : <View style={{ flex: 1, paddingTop: Platform.OS === 'ios' ? headerHeight : 0 }}>{children}</View>}
    {!state.hydrated && <View style={styles.loading}><ActivityIndicator /></View>}
  </View>;
}
export function Section({ title, footer, children }: React.PropsWithChildren<{ title?: string; footer?: string }>) {
  const theme = useTheme();
  return <View style={{ marginBottom: 26 }}>
    {!!title && <Text style={[styles.sectionLabel, { color: theme.muted }]}>{title}</Text>}
    <View style={{ borderRadius: 20, backgroundColor: theme.panel, overflow: 'hidden' }}>{children}</View>
    {!!footer && <Text style={[styles.footer, { color: theme.muted }]}>{footer}</Text>}
  </View>;
}
export function Row({ title, detail, children, onPress, destructive }: React.PropsWithChildren<{ title: string; detail?: string; onPress?: () => void; destructive?: boolean }>) {
  const theme = useTheme();
  const content = <><View style={{ flex: 1, gap: 3 }}><Text style={{ fontSize: 17, color: destructive ? theme.danger : theme.text }}>{title}</Text>
    {!!detail && <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 19 }}>{detail}</Text>}</View>{children}
    {!!onPress && <Icon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={14} color={theme.muted} />}</>;
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.55 : 1 }]}>{content}</Pressable>
    : <View style={styles.row}>{content}</View>;
}
export function Message({ children, error = false }: React.PropsWithChildren<{ error?: boolean }>) {
  const theme = useTheme();
  if (!children) return null;
  return <Text accessibilityLiveRegion="polite" style={{ fontSize: 14, lineHeight: 21, color: error ? theme.danger : theme.muted, marginVertical: 10 }}>{children}</Text>;
}
export function EmptyMixer({ profile = false }: { profile?: boolean }) {
  const theme = useTheme();
  return <View style={{ paddingHorizontal: 18, paddingTop: 70, alignItems: 'center', gap: 18 }}>
    <Glass style={{ width: 96, height: 96, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={{ ios: profile ? 'person.crop.circle' : 'headphones', android: profile ? 'account_circle' : 'headphones', web: profile ? 'account_circle' : 'headphones' }} size={46} />
    </Glass>
    <Text style={{ color: theme.text, fontSize: 27, fontWeight: '700', textAlign: 'center' }}>{profile ? 'Not connected' : 'No mixer connected'}</Text>
    <Text style={{ color: theme.muted, fontSize: 17, lineHeight: 25, textAlign: 'center', maxWidth: 300 }}>
      {profile ? 'Connect to a mixer to sign in.' : 'Select a server to view channels.'}
    </Text>
    <NativeButton title="Connect to mixer" symbol="wifi" onPress={() => router.push('/connect')} prominent />
  </View>;
}
export const styles = StyleSheet.create({
  page: { padding: 20, paddingTop: 16, paddingBottom: 120 },
  headerButton: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  row: { minHeight: 56, paddingHorizontal: 16, paddingVertical: 13, flexDirection: 'row', gap: 12, alignItems: 'center' },
  sectionLabel: { fontSize: 13, textTransform: 'uppercase', marginLeft: 16, marginBottom: 8, letterSpacing: 0.4 },
  footer: { fontSize: 13, lineHeight: 19, marginTop: 9, marginHorizontal: 16 },
  loading: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center' },
});
