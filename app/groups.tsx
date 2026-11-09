import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Page, Section, Row, Message } from '../src/components/ui';
import NativeButton from '../src/components/NativeButton';
import { useSession } from '../src/mixer/context';
import { orderedChannels } from '../src/mixer/model';
import { useTheme } from '../src/theme';

export default function Groups() {
  const { session, state, mix } = useSession(), theme = useTheme();
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { setSelected([]); setError(''); }, [state.server, mix.aux]);
  const channels = orderedChannels(mix.config, state.preferences);
  const groups = state.preferences.groupsByAux[String(mix.aux)] || [];
  const label = (members: number[]) => members.map(id => channels.find(c => c.channel === id)?.label || 'Channel ' + id).join(' / ');
  const available = channels.filter(channel => !groups.some(group => group.includes(channel.channel)));
  return <Page title="Channel groups">
    <Text style={{ color: theme.muted, lineHeight: 22, marginBottom: 20 }}>Group channels for this monitor mix. One fader keeps their level balance; open the group to adjust each channel. Pan stays individual.</Text>
    {!!groups.length && <Section title="YOUR GROUPS" footer="Ungrouping changes the layout only. Desk levels stay unchanged.">
      {groups.map(group => <Row key={group[0]} title={label(group)} detail={group.length + ' linked channels'}>
        <NativeButton title="Ungroup" accessibilityLabel={'Ungroup ' + label(group)} onPress={() => { session.removeGroup(group[0]); setSelected([]); }} />
      </Row>)}
    </Section>}
    <View style={{ marginBottom: 16 }}>
      <NativeButton title={'Group selected (' + selected.length + ')'} symbol="link" prominent disabled={!mix.aux || selected.length < 2} onPress={() => {
        if (session.createGroup(selected)) { setSelected([]); setError(''); session.notifySuccess('Channel group created'); }
        else { setSelected([]); setError('The available channels changed. Select them again.'); }
      }} />
    </View>
    <Message error>{error}</Message>
    <Section title="SELECT CHANNELS" footer="Choose at least two channels. A channel can belong to one group per AUX. Grouping also shows any selected hidden channels.">
      {available.map(channel => <Row key={channel.channel} title={channel.label}>
        <NativeButton title={selected.includes(channel.channel) ? 'Selected' : 'Select'} accessibilityLabel={(selected.includes(channel.channel) ? 'Deselect ' : 'Select ') + channel.label} symbol={selected.includes(channel.channel) ? 'checkmark.circle.fill' : 'circle'}
          onPress={() => setSelected(ids => ids.includes(channel.channel) ? ids.filter(id => id !== channel.channel) : [...ids, channel.channel])} />
      </Row>)}
      {!available.length && <Text style={{ color: theme.muted, padding: 16 }}>{channels.length ? 'All channels are grouped.' : 'Connect to a mixer first.'}</Text>}
    </Section>
  </Page>;
}
