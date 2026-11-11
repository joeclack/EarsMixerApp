import { Platform, Pressable, Text, View } from 'react-native';
import { Section, Row, Message, Icon } from './ui';
import NativeButton from './NativeButton';
import { useTheme } from '../theme';
import { groupLabel } from '../mixer/groups';
import { useGroupsList } from './useGroupsList';
export default function GroupsList() {
  const list = useGroupsList(), theme = useTheme();
  return <><Message error>{list.error}</Message><Section title="Your groups">
    {Platform.OS === 'android' ? <Pressable accessibilityRole="button" accessibilityLabel="Create new group"
      accessibilityState={{ disabled: !list.canCreate }} disabled={!list.canCreate} onPress={() => list.open('new')}
      style={({ pressed }) => ({ minHeight: 56, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
        borderBottomWidth: 1, borderBottomColor: theme.line, opacity: !list.canCreate ? 0.4 : pressed ? 0.6 : 1 })}>
      <Icon name={{ android: 'add_circle_outline' }} />
      <Text style={{ flex: 1, color: theme.tint, fontSize: 17 }}>Create new group</Text>
    </Pressable> : <NativeButton title="Create new group" symbol="plus" disabled={!list.canCreate} onPress={() => list.open('new')} />}
    {list.groups.map(group => <View key={group.id}>
      <Row title={groupLabel(group, list.channels)} detail={group.members.length + ' channels'} onPress={() => list.open(group.id)} />
      <NativeButton compact title="Delete" destructive disabled={list.busy} onPress={() => list.remove([group.id])} />
    </View>)}
    {!list.groups.length && <Text style={{ padding: 16, color: theme.muted }}>No channel groups yet</Text>}
  </Section></>;
}
