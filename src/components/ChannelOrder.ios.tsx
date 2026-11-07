import React from 'react';
import { Host, List, Section, Text } from '@expo/ui/swift-ui';
import { environment } from '@expo/ui/swift-ui/modifiers';
import { useSession } from '../mixer/context';
import { orderedChannels } from '../mixer/model';
import { useTheme } from '../theme';
export default function ChannelOrder() {
  const { session, state, mix } = useSession(), theme = useTheme();
  const channels = orderedChannels(mix.config, state.preferences);
  return <Host style={{ flex: 1 }} colorScheme={theme.scheme}>
    <List modifiers={[environment('editMode', 'active')]}>
      <Section footer={<Text>Drag the handles to arrange your channels. Your order is saved with your layout.</Text>}>
        <List.ForEach data={channels} keyExtractor={channel => String(channel.channel)} onMove={(indices, destination) => {
          const moving = channels.filter((_item, index) => indices.includes(index));
          const remaining = channels.filter((_item, index) => !indices.includes(index));
          remaining.splice(destination - indices.filter(index => index < destination).length, 0, ...moving);
          session.preferences({ channelOrder: remaining.map(channel => channel.channel) });
        }}>{({ item }) => <Text>{item.label}</Text>}</List.ForEach>
        {!channels.length && <Text>Connect to your mixer to arrange its channels.</Text>}
      </Section>
    </List>
  </Host>;
}
