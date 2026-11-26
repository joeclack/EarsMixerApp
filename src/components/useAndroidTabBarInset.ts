import { useSyncExternalStore } from 'react';
import { Keyboard, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { androidTabBarHeight, hidesMixerTabs } from './mixerNavigation';

function subscribeToKeyboard(onChange: () => void) {
  if (Platform.OS !== 'android') return () => {};
  const show = Keyboard.addListener('keyboardDidShow', onChange);
  const hide = Keyboard.addListener('keyboardDidHide', onChange);
  return () => { show.remove(); hide.remove(); };
}

function keyboardVisible() {
  return Platform.OS === 'android' && Keyboard.isVisible();
}

export function useAndroidKeyboardVisible() {
  return useSyncExternalStore(subscribeToKeyboard, keyboardVisible, keyboardVisible);
}

// Trailing space that lets Android content scroll fully above the pill.
export function useAndroidTabBarInset(tab: string) {
  const { width, height, fontScale } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const keyboardOpen = useAndroidKeyboardVisible();
  if (Platform.OS !== 'android' || keyboardOpen) return 0;
  return bottom + (hidesMixerTabs(width, height, tab) ? 0 : androidTabBarHeight(fontScale));
}
