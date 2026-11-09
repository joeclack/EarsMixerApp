import { Host } from '@expo/ui';
import { List, Text, Button, HStack, VStack, Spacer, Image } from '@expo/ui/swift-ui';
import { font, lineLimit, foregroundStyle, scrollContentBackground, disabled, listRowBackground, listRowSeparatorTint } from '@expo/ui/swift-ui/modifiers';
import Section from './HardwareSection.ios';
import { hardwarePalette } from './hardwarePalette';
import { useTheme } from '../theme';
import { groupChannelNames, groupLabel } from '../mixer/groups';
import { useGroupsList } from './useGroupsList';

export default function GroupsList() {
  const list = useGroupsList(), theme = useTheme(), palette = hardwarePalette(theme.dark);
  const rowStyle = [listRowBackground(palette.surface), listRowSeparatorTint(palette.edge)];
  return <Host style={{ flex: 1 }} colorScheme={theme.scheme} seedColor={theme.tint}>
    <List modifiers={[scrollContentBackground('hidden'), disabled(list.busy)]}>
      <Section title="Your groups">
        <Button label="Create new group" systemImage="plus" onPress={() => list.open('new')} modifiers={[disabled(!list.canCreate)]} />
        {!!list.error && <Text modifiers={[foregroundStyle(theme.danger)]}>{list.error}</Text>}
        <List.ForEach data={list.groups} keyExtractor={group => String(group.id)} onDelete={indices => list.remove(indices.map(index => list.groups[index].id))}>{({ item: group }) => {
          const title = groupLabel(group, list.channels);
          const content = <VStack alignment="leading" spacing={4}>
            <Text modifiers={[lineLimit(2), foregroundStyle(theme.text)]}>{title}</Text>
            <Text modifiers={[font({ textStyle: 'caption' }), lineLimit(2), foregroundStyle(theme.muted)]}>{group.allAuxes ? 'All monitor mixes' : 'This monitor mix'} · {group.members.length} channels{group.name ? ' · ' + groupChannelNames(group, list.channels) : ''}</Text>
          </VStack>;
          return <Button onPress={() => list.open(group.id)} modifiers={rowStyle}>
              <HStack spacing={12}>{content}<Spacer /><Image systemName="chevron.right" size={13} color={theme.muted} /></HStack>
            </Button>;
        }}</List.ForEach>
        {!list.groups.length && <VStack alignment="leading" spacing={6}>
          <Text>No channel groups yet</Text>
        </VStack>}
      </Section>
    </List>
  </Host>;
}
