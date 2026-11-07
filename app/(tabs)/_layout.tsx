import { NativeTabs } from 'expo-router/native-tabs';
import { useTheme } from '../../src/theme';
export default function TabLayout() {
  const theme = useTheme();
  return <NativeTabs tintColor={theme.tint} minimizeBehavior="onScrollDown" sidebarAdaptable>
    <NativeTabs.Trigger name="(mixer)">
      <NativeTabs.Trigger.Label>Mixer</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf="slider.horizontal.3" md="tune" />
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="profile">
      <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} md="account_circle" />
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="settings">
      <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
    </NativeTabs.Trigger>
  </NativeTabs>;
}
