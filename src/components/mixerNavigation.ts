import { Platform } from 'react-native';

export function androidTabBarHeight(fontScale: number) {
  return 74 + Math.ceil(16 * Math.max(0, fontScale - 1));
}

export function usesMixerSideRail(width: number, height: number) {
  if (width <= height) return false;
  if (Platform.OS === 'android') return height < 600;
  return !(Platform.OS === 'ios' && Platform.isPad);
}

export function hidesMixerTabs(width: number, height: number, tab: string | undefined) {
  // Android keeps the bar on secondary screens so returning to the mixer is
  // possible without rotating the device.
  return usesMixerSideRail(width, height) && (Platform.OS !== 'android' || tab === '(mixer)');
}
