import React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View, type ColorValue } from 'react-native';
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
export function Page({ title, children, scroll = true, compactHeader = true, toolbar, hideHeader = false }: React.PropsWithChildren<{ title: string; scroll?: boolean; compactHeader?: boolean; toolbar?: React.ReactNode; hideHeader?: boolean }>) {
  const theme = useTheme();
  const { state, mix } = useSession();
  const headerHeight = useHeaderHeight();
  const options = {
    headerShown: !hideHeader, title, headerLargeTitleEnabled: !compactHeader, headerTransparent: Platform.OS === 'ios',
    headerTitleStyle: { color: theme.text },
    ...(toolbar && { title: '', headerTitle: '', headerBackVisible: false,
      ...(Platform.OS === 'web' && { headerLeft: () => <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>{title}</Text> }) }),
    headerShadowVisible: false, headerLargeTitleShadowVisible: false, headerTintColor: theme.tint,
    headerStyle: { backgroundColor: 'transparent' },
    ...(!toolbar && Platform.OS !== 'ios' && { headerRight: () => <Pressable accessibilityRole="button" accessibilityLabel="Connect to mixer" onPress={() => router.push('/connect')} style={styles.headerButton}>
      <Icon name={{ ios: mix.status === 'connected' ? 'wifi' : 'wifi.slash', android: 'wifi', web: 'wifi' }} color={mix.status === 'connected' ? theme.green : theme.danger} />
    </Pressable> }),
  };
  return <View style={{ flex: 1, backgroundColor: theme.bg }}>
    <Stack.Screen options={options} />
    {!hideHeader && toolbar}
    {!hideHeader && !toolbar && Platform.OS === 'ios' && <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button icon={mix.status === 'connected' ? 'wifi' : 'wifi.slash'} tintColor={mix.status === 'connected' ? theme.green : theme.danger}
        accessibilityLabel="Connect to mixer" onPress={() => router.push('/connect')} />
    </Stack.Toolbar>}
    {scroll ? <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets
      contentContainerStyle={styles.page}>{children}</ScrollView> : <View style={{ flex: 1, paddingTop: !hideHeader && Platform.OS === 'ios' ? headerHeight : 0 }}>{children}</View>}
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
export function EmptyMixer() {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingBottom: 32 }}>
    <NativeButton title="Connect" onPress={() => router.push('/connect')} prominent />
  </View>;
}
export const styles = StyleSheet.create({
  page: { padding: 20, paddingTop: 16, paddingBottom: 32 },
  headerButton: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  row: { minHeight: 56, paddingHorizontal: 16, paddingVertical: 13, flexDirection: 'row', gap: 12, alignItems: 'center' },
  sectionLabel: { fontSize: 13, textTransform: 'uppercase', marginLeft: 16, marginBottom: 8, letterSpacing: 0.4 },
  footer: { fontSize: 13, lineHeight: 19, marginTop: 9, marginHorizontal: 16 },
  loading: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center' },
});
