import { useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Icon } from '../../src/components/ui';
export default function TabsWeb() {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.tint, tabBarStyle: { display: width > height ? 'none' : 'flex', backgroundColor: theme.panel, borderTopColor: theme.line } }}>
    <Tabs.Screen name="(mixer)" options={{ title: 'Mixer', tabBarIcon: ({ color }) => <Icon name={{ web: 'tune' }} color={color} /> }} />
    <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Icon name={{ web: 'settings' }} color={color} /> }} />
  </Tabs>;
}
