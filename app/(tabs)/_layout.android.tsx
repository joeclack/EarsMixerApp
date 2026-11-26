import { Tabs } from 'expo-router';
import AndroidTabBar from '../../src/components/AndroidTabBar';
import { Icon } from '../../src/components/ui';

const tabs = [
  { name: '(mixer)', title: 'Mixer', icon: 'tune' },
  { name: 'channels', title: 'Channels', icon: 'list' },
  { name: 'settings', title: 'Settings', icon: 'settings' },
] as const;

export default function TabLayout() {
  return <Tabs initialRouteName="(mixer)" backBehavior="history" screenOptions={{ headerShown: false }}
    tabBar={props => <AndroidTabBar {...props} />}>
    {tabs.map(tab => <Tabs.Screen key={tab.name} name={tab.name} options={{
      title: tab.title,
      tabBarIcon: ({ color, size }) => <Icon name={{ android: tab.icon }} color={color} size={size} />,
    }} />)}
  </Tabs>;
}
