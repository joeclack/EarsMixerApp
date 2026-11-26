import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';
import { androidTabBarHeight, hidesMixerTabs } from './mixerNavigation';
import { useAndroidKeyboardVisible } from './useAndroidTabBarInset';

// Where a toast's bottom edge sits: just above the tab bar while it shows,
// otherwise just above the bottom of the screen. The iPad bar sits at the top.
export function useToastBottom(gap: number) {
  const insets = useSafeAreaInsets();
  const { width, height, fontScale } = useWindowDimensions();
  const segments = useSegments() as string[];
  const pad = Platform.OS === 'ios' && Platform.isPad;
  const tabsShown = segments[0] === '(tabs)' && !pad && !hidesMixerTabs(width, height, segments[1]);
  const keyboardOpen = useAndroidKeyboardVisible();
  if (keyboardOpen) return gap;
  const tabHeight = Platform.OS === 'android' ? androidTabBarHeight(fontScale) : Platform.OS === 'ios' ? 62 : 56;
  return insets.bottom + gap + (tabsShown ? tabHeight : 0);
}
