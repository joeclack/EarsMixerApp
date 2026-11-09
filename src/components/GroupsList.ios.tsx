import { Host } from '@expo/ui';
import { List, Text, Button, HStack, VStack, Spacer, Image } from '@expo/ui/swift-ui';
import { environment, font, lineLimit, foregroundStyle, scrollContentBackground, disabled, listRowBackground, listRowSeparatorTint } from '@expo/ui/swift-ui/modifiers';
import Section from './HardwareSection.ios';
import { hardwarePalette } from './hardwarePalette';
import { useTheme } from '../theme';
import { groupChannelNames, groupLabel } from '../mixer/groups';
import { useGroupsList } from './useGroupsList';

export default function GroupsList() {
  const list = useGroupsList(), theme = useTheme(), palette = hardwarePalette(theme.dark);
  const rowStyle = [listRowBackground(palette.surface), listRowSeparatorTint(palette.edge)];
  return <Host style={{ flex: 1 }} colorScheme={theme.scheme} seedColor={theme.tint}>
    <List selection={list.selected.map(String)} onSelectionChange={list.select}
      modifiers={[scrollContentBackground('hidden'), environment('editMode', list.selecting ? 'active' : 'inactive'), disabled(list.busy)]}>
      <Section>
        {!list.selecting && <Button label="Create new group" systemImage="plus" onPress={() => list.open('new')} modifiers={[disabled(!list.canCreate)]} />}
        <Button label={list.selecting ? 'Cancel selection' : 'Select'} onPress={list.toggleSelecting} modifiers={[disabled(!list.groups.length)]} />
        {list.selecting && <>
          <Button label={list.selected.length === list.groups.length ? 'Clear selection' : 'Select all'} onPress={list.toggleAll} />
          <Button label={list.busy ? 'Deleting…' : 'Delete (' + list.selected.length + ')'} role="destructive" onPress={list.remove} modifiers={[disabled(!list.selected.length)]} />
        </>}
        {!!list.error && <Text modifiers={[foregroundStyle(theme.danger)]}>{list.error}</Text>}
      </Section>
      <Section title="Your groups" symbol="link" footer="Groups for all mixes are shared across AUXes on this device for this mixer. Deleting groups keeps channel levels unchanged.">
        <List.ForEach data={list.groups} keyExtractor={group => String(group.id)}>{({ item: group }) => {
          const title = groupLabel(group, list.channels);
          const content = <VStack alignment="leading" spacing={4}>
            <Text modifiers={[lineLimit(2), foregroundStyle(theme.text)]}>{title}</Text>
            <Text modifiers={[font({ textStyle: 'caption' }), lineLimit(2), foregroundStyle(theme.muted)]}>{group.allAuxes ? 'All monitor mixes' : 'This monitor mix'} · {group.members.length} channels{group.name ? ' · ' + groupChannelNames(group, list.channels) : ''}</Text>
          </VStack>;
          return list.selecting ? <VStack alignment="leading" modifiers={rowStyle}>{content}</VStack>
            : <Button onPress={() => list.open(group.id)} modifiers={rowStyle}>
              <HStack spacing={12}>{content}<Spacer /><Image systemName="chevron.right" size={13} color={theme.muted} /></HStack>
            </Button>;
        }}</List.ForEach>
        {!list.groups.length && <VStack alignment="leading" spacing={6}>
          <Text>No channel groups yet</Text>
          <Text modifiers={[foregroundStyle(theme.muted)]}>{list.canCreate ? 'Create a group to link two or more channels.' : 'Connect to a mixer and choose a monitor mix first.'}</Text>
        </VStack>}
      </Section>
    </List>
  </Host>;
}
