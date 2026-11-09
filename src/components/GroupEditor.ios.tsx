import GroupCreateToolbar from './GroupCreateToolbar';
import { Host } from '@expo/ui';
import { List, Text, TextField, Toggle, Button, HStack, VStack, Spacer, useNativeState } from '@expo/ui/swift-ui';
import { accessibilityLabel, buttonStyle, disabled, environment, font, foregroundStyle, lineLimit, listRowBackground, listRowSeparatorTint, scrollContentBackground, autocorrectionDisabled, textInputAutocapitalization } from '@expo/ui/swift-ui/modifiers';
import Section from './HardwareSection.ios';
import { hardwarePalette } from './hardwarePalette';
import { useTheme } from '../theme';
import { closeGroupEditor, useGroupEditor, type GroupEditorProps } from './useGroupEditor';

export default function GroupEditor(props: GroupEditorProps) {
  const editor = useGroupEditor(props), theme = useTheme(), palette = hardwarePalette(theme.dark);
  const name = useNativeState(editor.name);
  const rowStyle = [listRowBackground(palette.surface), listRowSeparatorTint(palette.edge)];
  return <><GroupCreateToolbar {...editor} /><Host style={{ flex: 1 }} colorScheme={theme.scheme} seedColor={theme.tint}>
    <List modifiers={[scrollContentBackground('hidden'), environment('editMode', 'active'), disabled(editor.busy)]}>
      {!editor.valid ? <Section>
        <Text modifiers={[foregroundStyle(theme.danger)]}>{editor.unavailableMessage}</Text>
        <Button label="Channel groups" onPress={closeGroupEditor} />
      </Section> : <>
        {!!editor.error && <Section><Text modifiers={[foregroundStyle(theme.danger)]}>{editor.error}</Text></Section>}
        <Section title="Applies to" footer={!editor.allAuxes ? editor.mixName : undefined}>
          <Toggle label="All monitor mixes" isOn={editor.allAuxes} onIsOnChange={editor.setAllAuxes} modifiers={[disabled(!editor.allAuxes && !editor.canApplyAll)]} />
        </Section>
        <Section title="Group name">
          <TextField placeholder="Group name" text={name} maxLength={80} onTextChange={editor.rename}
            modifiers={[accessibilityLabel('Group name'), autocorrectionDisabled(true), textInputAutocapitalization('words')]} />
        </Section>
        <Section title={'Channels (' + editor.members.length + ')'}>
          <List.ForEach data={editor.members} keyExtractor={channel => String(channel.channel)} onMove={editor.move}>
            {({ item: channel }) => <HStack spacing={12} modifiers={rowStyle}>
              <VStack alignment="leading" spacing={4}>
                <Text modifiers={[lineLimit(2), foregroundStyle(theme.text)]}>{channel.label}</Text>
                {channel.unavailable && <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(theme.muted)]}>Currently unavailable</Text>}
              </VStack>
              <Spacer />
              <Button label="Remove" role="destructive" onPress={() => editor.removeMember(channel.channel)}
                modifiers={[buttonStyle('borderless'), disabled(!editor.canRemove), accessibilityLabel('Remove ' + channel.label)]} />
            </HStack>}
          </List.ForEach>
          {!editor.members.length && <Text modifiers={[foregroundStyle(theme.muted)]}>Add channels below.</Text>}
        </Section>
        <Section title="Add channels">
          <List.ForEach data={editor.available} keyExtractor={channel => String(channel.channel)}>{({ item: channel }) =>
            <Button label={channel.label} systemImage="plus.circle" onPress={() => editor.add(channel.channel)} modifiers={[...rowStyle, accessibilityLabel('Add ' + channel.label)]} />
          }</List.ForEach>
          {!editor.available.length && <Text modifiers={[foregroundStyle(theme.muted)]}>No other channels available to add.</Text>}
        </Section>
        {!editor.creating && <Section>
          <Button label={editor.busy ? 'Deleting…' : 'Delete group'} role="destructive" onPress={editor.remove} />
        </Section>}
      </>}
    </List>
  </Host></>;
}
