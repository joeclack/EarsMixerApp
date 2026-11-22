import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';

// How much the bottom tab bar covers above the safe area: the floating iOS bar,
// Android's navigation bar and the web tab bar.
const TAB_BAR = Platform.select({ ios: 62, android: 80, default: 56 });

// Where a toast's bottom edge sits: just above the tab bar while it shows,
// otherwise just above the bottom of the screen. Phones in landscape hide the
// tab bar, and on iPad it sits at the top.
export function useToastBottom(gap: number) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const segments = useSegments() as string[];
  const pad = Platform.OS === 'ios' && Platform.isPad;
  const tabsShown = segments[0] === '(tabs)' && !pad && width <= height;
  return insets.bottom + gap + (tabsShown ? TAB_BAR : 0);
}
