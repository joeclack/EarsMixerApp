import { Pressable, Text, View } from 'react-native';
import { Section, Icon, Message } from './ui';
import NativeButton from './NativeButton';
import { useTheme } from '../theme';
import { groupChannelNames, groupLabel } from '../mixer/groups';
import { useGroupsList } from './useGroupsList';

export default function GroupsList() {
  const list = useGroupsList(), theme = useTheme();
  return <>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
      {!list.selecting && <NativeButton title="Create new group" symbol="plus" prominent disabled={!list.canCreate} onPress={() => list.open('new')} />}
      <NativeButton title={list.selecting ? 'Cancel' : 'Select'} disabled={list.busy || !list.groups.length} onPress={list.toggleSelecting} />
      {list.selecting && <>
        <NativeButton title={list.selected.length === list.groups.length ? 'Clear selection' : 'Select all'} disabled={list.busy} onPress={list.toggleAll} />
        <NativeButton title={list.busy ? 'Deleting…' : 'Delete (' + list.selected.length + ')'} destructive disabled={list.busy || !list.selected.length} onPress={list.remove} />
      </>}
    </View>
    <Message error>{list.error}</Message>
    <Section title="YOUR GROUPS" footer="Groups for all mixes are shared across AUXes on this device for this mixer. Deleting groups keeps channel levels unchanged.">
      {list.groups.map(group => <Pressable key={group.id} accessibilityRole={list.selecting ? 'checkbox' : 'button'}
        disabled={list.busy} accessibilityLabel={groupLabel(group, list.channels)} accessibilityState={{ disabled: list.busy, ...(list.selecting ? { checked: list.selected.includes(group.id) } : {}) }}
        onPress={() => list.selecting ? list.toggle(group.id) : list.open(group.id)}
        style={({ pressed }) => ({ minHeight: 64, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.6 : 1 })}>
        {list.selecting && <Icon name={{ ios: list.selected.includes(group.id) ? 'checkmark.circle.fill' : 'circle', android: list.selected.includes(group.id) ? 'check_circle' : 'radio_button_unchecked', web: list.selected.includes(group.id) ? 'check_circle' : 'radio_button_unchecked' }} />}
        <View style={{ flex: 1, gap: 4 }}>
          <Text numberOfLines={2} style={{ color: theme.text, fontSize: 17, fontWeight: '600' }}>{groupLabel(group, list.channels)}</Text>
          <Text numberOfLines={2} style={{ color: theme.muted, fontSize: 13 }}>{group.allAuxes ? 'All monitor mixes' : 'This monitor mix'} · {group.members.length} channels{group.name ? ' · ' + groupChannelNames(group, list.channels) : ''}</Text>
        </View>
        {!list.selecting && <Icon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={16} />}
      </Pressable>)}
      {!list.groups.length && <View style={{ padding: 20, gap: 8 }}>
        <Text style={{ color: theme.text, fontSize: 17 }}>No channel groups yet</Text>
        <Text style={{ color: theme.muted }}>{list.canCreate ? 'Create a group to link two or more channels.' : 'Connect to a mixer and choose a monitor mix first.'}</Text>
      </View>}
    </Section>
  </>;
}
