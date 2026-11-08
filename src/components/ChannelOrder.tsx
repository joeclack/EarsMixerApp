import React from 'react';
import { ScrollView, Text, View, Pressable, Switch } from 'react-native';
import { useSession } from '../mixer/context';
import { orderedChannels, hiddenChannels } from '../mixer/model';
import { useTheme } from '../theme';
import { Icon, Section, Row } from './ui';
export default function ChannelOrder() {
  const { session, state, mix } = useSession(), theme = useTheme();
  const hidden = hiddenChannels(mix.config, state.preferences, mix.aux);
  const channels = orderedChannels(mix.config, state.preferences);
  function move(from: number, to: number) {
    if (to < 0 || to >= channels.length) return;
    const ids = channels.map(c => c.channel); const [id] = ids.splice(from, 1); ids.splice(to, 0, id);
    session.preferences({ channelOrder: ids });
  }
  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 20 }}>
    <Section>
      {channels.map((channel, index) => <Row key={channel.channel} title={channel.label}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Switch accessibilityLabel={'Show ' + channel.label} value={!hidden.includes(channel.channel)} onValueChange={visible => session.setChannelHidden(channel.channel, !visible)} />
          {[-1, 1].map(direction => <Pressable key={direction} accessibilityRole="button" accessibilityLabel={'Move ' + channel.label + (direction < 0 ? ' up' : ' down')}
            disabled={index + direction < 0 || index + direction >= channels.length} onPress={() => move(index, index + direction)} style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' }}>
            <Icon name={{ android: direction < 0 ? 'arrow_upward' : 'arrow_downward', web: direction < 0 ? 'arrow_upward' : 'arrow_downward' }} />
          </Pressable>)}
        </View>
      </Row>)}
      {!channels.length && <Text style={{ padding: 20, color: theme.muted }}>Connect to a mixer to reorder channels.</Text>}
    </Section>
  </ScrollView>;
}
