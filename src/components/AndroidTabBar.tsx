import { useEffect } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useTheme } from '../theme';
import { androidTabBarHeight, hidesMixerTabs } from './mixerNavigation';
import { useAndroidKeyboardVisible } from './useAndroidTabBarInset';

const TAB_GAP = 4;

export default function AndroidTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const theme = useTheme();
  const { width, height, fontScale } = useWindowDimensions();
  const keyboardOpen = useAndroidKeyboardVisible();
  const active = useSharedValue(state.index);
  const rowWidth = useSharedValue(0);
  const count = state.routes.length;
  const direction = I18nManager.isRTL ? -1 : 1;
  useEffect(() => {
    active.set(withTiming(state.index, { duration: 220, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }));
  }, [active, state.index]);
  const selection = useAnimatedStyle(() => {
    const tabWidth = Math.max(0, (rowWidth.get() - TAB_GAP * (count - 1)) / count);
    return { width: tabWidth, transform: [{ translateX: direction * active.get() * (tabWidth + TAB_GAP) }] };
  });

  if (keyboardOpen || hidesMixerTabs(width, height, state.routes[state.index].name)) return null;

  return <View pointerEvents="box-none" style={[styles.bar, {
    height: androidTabBarHeight(fontScale) + insets.bottom, paddingBottom: 8 + insets.bottom,
    paddingLeft: 20 + insets.left, paddingRight: 20 + insets.right }]}>
    <View style={[styles.pill, { backgroundColor: theme.panel, borderColor: theme.line }]}>
      <View accessibilityRole="tablist" style={styles.row} onLayout={event => rowWidth.set(event.nativeEvent.layout.width)}>
        <Animated.View pointerEvents="none" style={[styles.selection, { backgroundColor: theme.secondary }, selection]} />
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const selected = state.index === index;
          const color = selected ? theme.tint : theme.muted;
          return <View key={route.key} style={styles.tabFrame}>
            <Pressable accessibilityRole="tab" accessibilityState={{ selected }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title} testID={options.tabBarButtonTestID}
              onPress={() => {
                const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!selected && !event.defaultPrevented) navigateToTab(route.key);
              }} onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
              {options.tabBarIcon?.({ focused: selected, color, size: 20 })}
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.label, { color, fontWeight: selected ? '700' : '600' }]}>{options.title}</Text>
            </Pressable>
          </View>;
        })}
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1, alignItems: 'center', paddingTop: 8 },
  pill: { flex: 1, width: '100%', maxWidth: 380, padding: 4,
    borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, elevation: 5 },
  row: { flex: 1, flexDirection: 'row', gap: TAB_GAP },
  selection: { position: 'absolute', start: 0, top: 0, bottom: 0, borderRadius: 999 },
  // Clip the native focus tint as well as the React Native content.
  tabFrame: { flex: 1, minWidth: 0, borderRadius: 999, overflow: 'hidden' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 10 },
  pressed: { opacity: 0.65 },
  label: { fontSize: 12, lineHeight: 16, includeFontPadding: false, textAlign: 'center' },
});
