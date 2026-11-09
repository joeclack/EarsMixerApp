import React from 'react';
import { Text, View } from 'react-native';
import { Section, Row, Message } from './ui';
import NativeButton from './NativeButton';
import { useTheme } from '../theme';
import { useGroupEditor } from './useGroupEditor';

export default function GroupEditor() {
  const editor = useGroupEditor(), theme = useTheme();
  return <>
    <Text style={{ color: theme.muted, lineHeight: 22, marginBottom: 20 }}>Group channels for this monitor mix. One fader keeps their level balance; open the group to adjust each channel. Pan stays individual.</Text>
    {!!editor.groups.length && <Section title="YOUR GROUPS" footer="Ungrouping changes the layout only. Desk levels stay unchanged.">
      {editor.groups.map(group => <Row key={group[0]} title={editor.label(group)} detail={group.length + ' linked channels'}>
        <NativeButton title="Ungroup" accessibilityLabel={'Ungroup ' + editor.label(group)} onPress={() => editor.remove(group)} />
      </Row>)}
    </Section>}
    <View style={{ marginBottom: 24, minHeight: 48 }}>
      <NativeButton title={'Group selected (' + editor.selected.length + ')'} symbol="link" prominent disabled={!editor.canCreate} onPress={editor.create} />
    </View>
    <Message error>{editor.error}</Message>
    <Section title="SELECT CHANNELS" footer="Choose at least two channels. A channel can belong to one group per AUX. Grouping also shows any selected hidden channels.">
      {editor.available.map(channel => <Row key={channel.channel} title={channel.label}>
        <NativeButton title={editor.selected.includes(channel.channel) ? 'Selected' : 'Select'} accessibilityLabel={(editor.selected.includes(channel.channel) ? 'Deselect ' : 'Select ') + channel.label} symbol={editor.selected.includes(channel.channel) ? 'checkmark.circle.fill' : 'circle'} onPress={() => editor.toggle(channel.channel)} />
      </Row>)}
      {!editor.available.length && <Text style={{ color: theme.muted, padding: 16 }}>{editor.channels.length ? 'All channels are grouped.' : 'Connect to a mixer first.'}</Text>}
    </Section>
  </>;
}
