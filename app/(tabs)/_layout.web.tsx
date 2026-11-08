import { Tabs } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Icon } from '../../src/components/ui';
export default function TabsWeb() {
  const theme = useTheme();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.tint, tabBarStyle: { backgroundColor: theme.panel, borderTopColor: theme.line } }}>
    <Tabs.Screen name="(mixer)" options={{ title: 'Mixer', tabBarIcon: ({ color }) => <Icon name={{ web: 'tune' }} color={color} /> }} />
    <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Icon name={{ web: 'settings' }} color={color} /> }} />
  </Tabs>;
}
