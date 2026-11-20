import { Platform, useWindowDimensions } from 'react-native';
import { NativeTabs } from 'expo-router/native-tabs';
import { useTheme } from '../../src/theme';
// Phone landscape gives the faders the full height, so the tab bar hides there.
// The side rail keeps the live controls; rotate back for Channels and Settings.
export default function TabLayout() {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const hidden = width > height && !(Platform.OS === 'ios' && Platform.isPad);
  return <NativeTabs hidden={hidden} tintColor={theme.tint} minimizeBehavior="onScrollDown" sidebarAdaptable>
    <NativeTabs.Trigger name="(mixer)">
      <NativeTabs.Trigger.Label>Mixer</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf="slider.horizontal.3" md="tune" />
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="channels">
      <NativeTabs.Trigger.Label>Channels</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf="list.bullet" md="list" />
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="settings">
      <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
    </NativeTabs.Trigger>
  </NativeTabs>;
}
