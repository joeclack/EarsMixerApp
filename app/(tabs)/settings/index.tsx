import { Platform } from 'react-native';
import { Page } from '../../../src/components/ui';
import SettingsContent from '../../../src/components/SettingsContent';
import { useAndroidTabBarInset } from '../../../src/components/useAndroidTabBarInset';
import { useIOSTabBarViewportInset } from '../../../src/components/useIOSTabBarViewportInset';

export default function Settings() {
  const androidTabBarInset = useAndroidTabBarInset('settings');
  const iosTabBarInset = useIOSTabBarViewportInset();
  return <Page title="Settings" scroll={Platform.OS !== 'ios'} bottomInset={androidTabBarInset || iosTabBarInset}><SettingsContent /></Page>;
}
