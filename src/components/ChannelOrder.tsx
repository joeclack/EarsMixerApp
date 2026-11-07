import React from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useSession } from '../mixer/context';
import { orderedChannels } from '../mixer/model';
import { useTheme } from '../theme';
import { Icon, Section, Row } from './ui';
export default function ChannelOrder() {
  const { session, state, mix } = useSession(), theme = useTheme();
  const channels = orderedChannels(mix.config, state.preferences);
  function move(from: number, to: number) {
    if (to < 0 || to >= channels.length) return;
    const ids = channels.map(c => c.channel); const [id] = ids.splice(from, 1); ids.splice(to, 0, id);
    session.preferences({ channelOrder: ids });
  }
  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 20 }}>
    <Section footer="Your order is saved with your layout.">
      {channels.map((channel, index) => <Row key={channel.channel} title={channel.label}>
        <View style={{ flexDirection: 'row' }}>
          {[-1, 1].map(direction => <Pressable key={direction} accessibilityRole="button" accessibilityLabel={'Move ' + channel.label + (direction < 0 ? ' up' : ' down')}
            disabled={index + direction < 0 || index + direction >= channels.length} onPress={() => move(index, index + direction)} style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' }}>
            <Icon name={{ android: direction < 0 ? 'arrow_upward' : 'arrow_downward', web: direction < 0 ? 'arrow_upward' : 'arrow_downward' }} />
          </Pressable>)}
        </View>
      </Row>)}
      {!channels.length && <Text style={{ padding: 20, color: theme.muted }}>Connect to your mixer to arrange its channels.</Text>}
    </Section>
  </ScrollView>;
}
