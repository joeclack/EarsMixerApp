import { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useTheme } from '../theme';
import { androidTabBarHeight, hidesMixerTabs } from './mixerNavigation';

export default function AndroidTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const theme = useTheme();
  const { width, height, fontScale } = useWindowDimensions();
  const [keyboardOpen, setKeyboardOpen] = useState(() => Keyboard.isVisible());
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  if (keyboardOpen) return null;
  if (hidesMixerTabs(width, height, state.routes[state.index].name)) {
    return <View style={{ height: insets.bottom, backgroundColor: theme.deskBg }} />;
  }

  return <View style={[styles.bar, { backgroundColor: theme.panel, borderTopColor: theme.line,
    height: androidTabBarHeight(fontScale) + insets.bottom, paddingBottom: 5 + insets.bottom,
    paddingLeft: 12 + insets.left, paddingRight: 12 + insets.right }]}>
    <View accessibilityRole="tablist" style={styles.row}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const selected = state.index === index;
        const color = selected ? theme.tint : theme.muted;
        return <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected }}
          accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title} testID={options.tabBarButtonTestID}
          onPress={() => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!selected && !event.defaultPrevented) navigateToTab(route.key);
          }} onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
          android_ripple={{ color: theme.text + '18' }}
          style={[styles.tab, selected && { backgroundColor: theme.secondary }]}>
          {options.tabBarIcon?.({ focused: selected, color, size: 20 })}
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.label, { color, fontWeight: selected ? '700' : '600' }]}>{options.title}</Text>
        </Pressable>;
      })}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  bar: { paddingTop: 5, borderTopWidth: StyleSheet.hairlineWidth },
  row: { flex: 1, flexDirection: 'row', alignSelf: 'center', width: '100%', maxWidth: 520, gap: 6 },
  tab: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 12, paddingHorizontal: 4, overflow: 'hidden' },
  label: { fontSize: 12, lineHeight: 16, includeFontPadding: false, textAlign: 'center' },
});
