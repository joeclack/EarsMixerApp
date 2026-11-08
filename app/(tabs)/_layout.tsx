import { useWindowDimensions } from 'react-native';
import { NativeTabs } from 'expo-router/native-tabs';
import { useTheme } from '../../src/theme';
export default function TabLayout() {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  return <NativeTabs hidden={width > height} tintColor={theme.tint} minimizeBehavior="onScrollDown" sidebarAdaptable>
    <NativeTabs.Trigger name="(mixer)">
      <NativeTabs.Trigger.Label>Mixer</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf="slider.horizontal.3" md="tune" />
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="settings">
      <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
    </NativeTabs.Trigger>
  </NativeTabs>;
}
