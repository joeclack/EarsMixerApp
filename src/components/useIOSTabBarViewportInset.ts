import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The floating iPhone tab bar can cover content beyond the reported safe area.
export function useIOSTabBarViewportInset() {
  const { width, height } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  if (Platform.OS !== 'ios' || Platform.isPad || width > height) return 0;
  return Number(Platform.Version) >= 26 ? Math.max(bottom, 88) : bottom;
}
