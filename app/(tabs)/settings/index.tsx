import { Platform } from 'react-native';
import { Page } from '../../../src/components/ui';
import SettingsContent from '../../../src/components/SettingsContent';
import { useAndroidTabBarInset } from '../../../src/components/useAndroidTabBarInset';

export default function Settings() {
  const tabBarInset = useAndroidTabBarInset('settings');
  return <Page title="Settings" scroll={Platform.OS !== 'ios'} bottomInset={tabBarInset}><SettingsContent /></Page>;
}
