import ScreenSurface from '../../../src/components/ScreenSurface';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Platform, ScrollView, View } from 'react-native';
import { useSession } from '../../../src/mixer/context';
import { useTheme } from '../../../src/theme';
import ChannelOrder from '../../../src/components/ChannelOrder';
import GroupsList from '../../../src/components/GroupsList';
import TemplatesList from '../../../src/components/TemplatesList';
import Segmented from '../../../src/components/Segmented';
import { styles } from '../../../src/components/ui';

type Tab = 'channels' | 'groups' | 'templates';
const TABS: { value: Tab; label: string }[] = [
  { value: 'channels', label: 'Channels' }, { value: 'groups', label: 'Groups' }, { value: 'templates', label: 'Templates' },
];
const isTab = (value: unknown): value is Tab => TABS.some(item => item.value === value);

// The Channels tab: channel order and visibility, channel groups and the
// mixer's shared templates, switched with a segmented control. Open a section
// directly with /channels?tab=groups or ?tab=templates.
export default function Channels() {
  const { session } = useSession(), theme = useTheme();
  const android = Platform.OS === 'android';
  const headerHeight = useHeaderHeight();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(isTab(params.tab) ? params.tab : 'channels');
  useEffect(() => { if (isTab(params.tab)) setTab(params.tab); }, [params.tab]);
  useFocusEffect(useCallback(() => { session.mixer.cancelWrites(); }, [session]));
  const scrolled = (content: ReactNode) => <ScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic"
    contentContainerStyle={styles.page}>{content}</ScrollView>;
  return <ScreenSurface>
    <Stack.Screen options={{ title: 'Channels', headerTransparent: !android, headerStyle: { backgroundColor: android ? theme.bg : 'transparent' }, headerShadowVisible: false, headerTintColor: theme.tint,
      headerTitleStyle: { color: theme.text } }} />
    <View style={[{ flex: 1, paddingTop: android ? 0 : headerHeight }, android && styles.androidPage]}>
      <View style={{ paddingHorizontal: android ? 20 : 16, paddingVertical: 8 }}>
        <Segmented label="Channels, groups or templates" value={tab} options={TABS} onChange={value => { if (isTab(value)) setTab(value); }} />
      </View>
      {tab === 'channels' ? <ChannelOrder />
        : tab === 'groups' ? (Platform.OS === 'ios' ? <GroupsList /> : scrolled(<GroupsList />))
        : scrolled(<TemplatesList />)}
    </View>
  </ScreenSurface>;
}
