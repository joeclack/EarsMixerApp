import GroupCreateToolbar from './GroupCreateToolbar';
import { Platform, Text, TextInput, View } from 'react-native';
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
    <GroupCreateToolbar {...editor} />
    <Message error>{editor.error}</Message>
    <Section title="APPLIES TO" card={Platform.OS !== 'android'} footer={!editor.allAuxes ? 'Only this mix: ' + editor.mixName : undefined}>
      <View style={{ paddingHorizontal: 16 }}>
      <Host matchContents={{ vertical: true }} colorScheme={theme.scheme} seedColor={theme.tint} style={{ minHeight: 56 }}>
        <Switch label="All monitor mixes" value={editor.allAuxes} onValueChange={editor.setAllAuxes} disabled={editor.busy || (!editor.allAuxes && !editor.canApplyAll)} />
      </Host>
      </View>
    </Section>
    <Section title="GROUP NAME">
      <TextInput accessibilityLabel="Group name" placeholder="Group name" placeholderTextColor={theme.muted} value={editor.name}
        onChangeText={editor.rename} editable={!editor.busy} maxLength={80} autoCorrect={false} autoCapitalize="words" autoComplete="off"
        style={{ color: theme.text, fontSize: 17, padding: 16, minHeight: 52, position: 'relative' }} />
    </Section>
    <Section title={'CHANNELS (' + editor.members.length + ')'}>
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
    <Section title="ADD CHANNELS">
      {editor.available.map(channel => <View key={channel.channel} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
        <NativeButton title={channel.label} symbol="plus.circle" accessibilityLabel={'Add ' + channel.label} disabled={editor.busy} onPress={() => editor.add(channel.channel)} />
      </View>)}
      {!editor.available.length && <Text style={{ color: theme.muted, padding: 16 }}>No other channels available to add.</Text>}
    </Section>
    {!editor.creating && <Section>
      <NativeButton title={editor.busy ? 'Deleting…' : 'Delete group'} destructive disabled={editor.busy} onPress={editor.remove} />
    </Section>}
  </>;
}
