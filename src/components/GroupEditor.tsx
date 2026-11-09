import { Text, TextInput, View } from 'react-native';
import { Host, Switch } from '@expo/ui';
import { Section, Message } from './ui';
import NativeButton from './NativeButton';
import { useTheme } from '../theme';
import { closeGroupEditor, useGroupEditor, type GroupEditorProps } from './useGroupEditor';

export default function GroupEditor(props: GroupEditorProps) {
  const editor = useGroupEditor(props), theme = useTheme();
  if (!editor.valid) return <>
    <Message error>{editor.unavailableMessage}</Message>
    <NativeButton title="Channel groups" onPress={closeGroupEditor} />
  </>;
  return <>
    {editor.creating && <View style={{ marginBottom: 20 }}><NativeButton title={editor.busy ? 'Saving…' : 'Save'} prominent disabled={!editor.canSave} onPress={editor.save} /></View>}
    <Message error>{editor.error}</Message>
    <Section title="APPLIES TO" footer={!editor.allAuxes && !editor.canApplyAll ? 'Some channels belong to groups in other mixes. Edit those groups before enabling All monitor mixes.' : editor.allAuxes ? 'Same group, name and channel order across all AUXes on this device for this mixer. Each AUX keeps its own levels and balance.' : 'Only this monitor mix.'}>
      <Host matchContents={{ vertical: true }} colorScheme={theme.scheme} seedColor={theme.tint} style={{ padding: 16, minHeight: 56 }}>
        <Switch label="All monitor mixes" value={editor.allAuxes} onValueChange={editor.setAllAuxes} disabled={editor.busy || (!editor.allAuxes && !editor.canApplyAll)} />
      </Host>
    </Section>
    <Section title="GROUP NAME" footer="Leave blank to use the channel names.">
      <TextInput accessibilityLabel="Group name" placeholder="Group name" placeholderTextColor={theme.muted} value={editor.name}
        onChangeText={editor.rename} editable={!editor.busy} maxLength={80} autoCorrect={false} autoCapitalize="words" autoComplete="off"
        style={{ color: theme.text, fontSize: 17, padding: 16, minHeight: 52, position: 'relative' }} />
    </Section>
    <Section title={'CHANNELS (' + editor.members.length + ')'} footer={editor.creating ? 'Choose at least two channels, put them in order, then tap Save.' : 'Changes save automatically. Use the arrows to reorder. Keep at least two channels in the group.'}>
      {editor.members.map((channel, index) => <View key={channel.channel} style={{ padding: 16, gap: 8 }}>
        <Text style={{ color: theme.text, fontSize: 17 }}>{index + 1}. {channel.label}</Text>
        {channel.unavailable && <Text style={{ color: theme.muted }}>Currently unavailable</Text>}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <NativeButton compact title="Up" symbol="arrow.up" accessibilityLabel={'Move ' + channel.label + ' up'} disabled={editor.busy || index === 0} onPress={() => editor.move([index], index - 1)} />
          <NativeButton compact title="Down" symbol="arrow.down" accessibilityLabel={'Move ' + channel.label + ' down'} disabled={editor.busy || index === editor.members.length - 1} onPress={() => editor.move([index], index + 2)} />
          <NativeButton compact title="Remove" destructive accessibilityLabel={'Remove ' + channel.label} disabled={!editor.canRemove} onPress={() => editor.removeMember(channel.channel)} />
        </View>
      </View>)}
      {!editor.members.length && <Text style={{ color: theme.muted, padding: 16 }}>Add channels below.</Text>}
    </Section>
    <Section title="ADD CHANNELS" footer="Channels in other groups are not available here.">
      {editor.available.map(channel => <View key={channel.channel} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
        <NativeButton title={channel.label} symbol="plus.circle" accessibilityLabel={'Add ' + channel.label} disabled={editor.busy} onPress={() => editor.add(channel.channel)} />
      </View>)}
      {!editor.available.length && <Text style={{ color: theme.muted, padding: 16 }}>No other channels available to add.</Text>}
    </Section>
    {!editor.creating && <Section footer={editor.allAuxes ? 'Deletes this group from all monitor mixes on this device. Channels and levels stay unchanged.' : 'Deleting the group keeps its channels and levels unchanged.'}>
      <NativeButton title={editor.busy ? 'Deleting…' : 'Delete group'} destructive disabled={editor.busy} onPress={editor.remove} />
    </Section>}
  </>;
}
