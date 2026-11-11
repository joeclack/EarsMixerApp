import { TextInput, View } from 'react-native';
import { Row, Switch } from '@expo/ui/jetpack-compose';
import { semantics } from '@expo/ui/jetpack-compose/modifiers';
import GroupCreateToolbar from './GroupCreateToolbar';
import GroupScopeHeading from './GroupScopeHeading';
import HardwarePanel from './HardwarePanel';
import NativeButton from './NativeButton';
import { Message } from './ui';
import { useTheme } from '../theme';
import { closeGroupEditor, useGroupEditor, type GroupEditorProps } from './useGroupEditor';
import { MaterialIconButton, MaterialItem, MaterialSection, MaterialSectionTitle } from './MaterialList.android';

// Native Material sections mirroring the iOS group form.
export default function GroupEditor(props: GroupEditorProps) {
  const editor = useGroupEditor(props), theme = useTheme();
  if (!editor.valid) return <>
    <Message error>{editor.unavailableMessage}</Message>
    <NativeButton title="Channel groups" onPress={closeGroupEditor} />
  </>;
  const scopeLocked = editor.busy || (!editor.allAuxes && !editor.canApplyAll);
  return <>
    <GroupCreateToolbar {...editor} />
    <GroupScopeHeading allAuxes={editor.allAuxes} mixName={editor.mixName} />
    <Message error>{editor.error}</Message>
    <MaterialSection>
      <MaterialItem title="All monitor mixes" symbol="headphones" disabled={scopeLocked}
        detail={!editor.allAuxes && !editor.canApplyAll ? 'Channels already grouped in another mix.' : undefined}
        onPress={() => editor.setAllAuxes(!editor.allAuxes)}
        trailing={<Switch value={editor.allAuxes} enabled={!scopeLocked} onCheckedChange={editor.setAllAuxes}
          modifiers={[semantics({ contentDescription: 'All monitor mixes' })]} />} />
    </MaterialSection>
    {/* Text entry stays a React Native field, in a card matching the sections. */}
    <View style={{ marginBottom: 24 }}>
      <MaterialSectionTitle title="Group name" symbol="edit" />
      <HardwarePanel radius={12} style={{ paddingHorizontal: 16 }}>
        <TextInput accessibilityLabel="Group name" placeholder="Group name" placeholderTextColor={theme.muted} value={editor.name}
          onChangeText={editor.rename} editable={!editor.busy} maxLength={80} autoCorrect={false} autoCapitalize="words" autoComplete="off"
          style={{ position: 'relative', color: theme.text, fontSize: 17, minHeight: 56, paddingVertical: 14 }} />
      </HardwarePanel>
    </View>
    <MaterialSection title={'Channels (' + editor.members.length + ')'} symbol="graphic_eq">
      {editor.members.map((channel, index) => <MaterialItem key={channel.channel} title={channel.label}
        detail={channel.unavailable ? 'Currently unavailable' : undefined}
        trailing={<Row verticalAlignment="center">
          <MaterialIconButton symbol="arrow_upward" label={'Move ' + channel.label + ' up'} disabled={editor.busy || index === 0} onPress={() => editor.move([index], index - 1)} />
          <MaterialIconButton symbol="arrow_downward" label={'Move ' + channel.label + ' down'} disabled={editor.busy || index === editor.members.length - 1} onPress={() => editor.move([index], index + 2)} />
          <MaterialIconButton symbol="remove_circle_outline" label={'Remove ' + channel.label + ' from group'} color={theme.danger} disabled={!editor.canRemove} onPress={() => editor.removeMember(channel.channel)} />
        </Row>} />)}
      {!editor.members.length && <MaterialItem title="No channels yet" detail="Add channels below." />}
    </MaterialSection>
    <MaterialSection title="Add channels" symbol="add">
      {editor.available.map(channel => <MaterialItem key={channel.channel} title={channel.label} symbol="add_circle_outline" disabled={editor.busy}
        onPress={() => editor.add(channel.channel)} />)}
      {!editor.available.length && <MaterialItem title="No other channels available to add." />}
    </MaterialSection>
    {!editor.creating && <MaterialSection>
      <MaterialItem title={editor.busy ? 'Deleting…' : 'Delete group'} symbol="delete" destructive disabled={editor.busy} onPress={editor.remove} />
    </MaterialSection>}
  </>;
}
