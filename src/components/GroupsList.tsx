import { Text, View } from 'react-native';
import { Section, Row, Message } from './ui';
import NativeButton from './NativeButton';
import { useTheme } from '../theme';
import { groupLabel } from '../mixer/groups';
import { useGroupsList } from './useGroupsList';
export default function GroupsList() {
  const list = useGroupsList(), theme = useTheme();
  return <><Message error>{list.error}</Message><Section title="YOUR GROUPS">
    <NativeButton title="Create new group" symbol="plus" disabled={!list.canCreate} onPress={() => list.open('new')} />
    {list.groups.map(group => <View key={group.id}>
      <Row title={groupLabel(group, list.channels)} detail={group.members.length + ' channels'} onPress={() => list.open(group.id)} />
      <NativeButton compact title="Delete" destructive disabled={list.busy} onPress={() => list.remove([group.id])} />
    </View>)}
    {!list.groups.length && <Text style={{ padding: 16, color: theme.muted }}>No channel groups yet</Text>}
  </Section></>;
}
