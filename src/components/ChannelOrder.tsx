import { ScrollView, Text, View, Pressable } from 'react-native';
import { Host, Switch } from '@expo/ui';
import { useTheme } from '../theme';
import { Icon, Section, Message } from './ui';
import NativeButton from './NativeButton';
import { useChannelOrder } from './useChannelOrder';

export default function ChannelOrder() {
  const order = useChannelOrder(), theme = useTheme();
  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 20 }}>
    <Message error>{order.error}</Message>
    <Section>
      {order.items.map((item, index) => <View key={item.key} style={{ padding: 16, gap: 8, borderBottomWidth: index < order.items.length - 1 ? 1 : 0, borderBottomColor: theme.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {item.group && <Icon name={{ ios: 'link', android: 'link', web: 'link' }} size={16} />}
          <Text numberOfLines={2} style={{ flex: 1, color: theme.text, fontSize: 17 }}>{item.label}</Text>
        </View>
        {!!item.detail && <Text style={{ color: theme.muted, fontSize: 13 }}>{item.detail}</Text>}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Host matchContents colorScheme={theme.scheme} seedColor={theme.tint}>
            <Switch label={'Show ' + item.label} value={item.visible} onValueChange={visible => order.show(item.key, visible)} />
          </Host>
          {item.group && <NativeButton compact title="Edit" accessibilityLabel={'Edit ' + item.label + ' group'} onPress={() => order.edit(item.group!.id)} />}
          <View style={{ flex: 1 }} />
          {[-1, 1].map(direction => {
            const disabled = index + direction < 0 || index + direction >= order.items.length;
            return <Pressable key={direction} accessibilityRole="button" accessibilityLabel={'Move ' + item.label + (direction < 0 ? ' up' : ' down')}
              accessibilityState={{ disabled }} disabled={disabled} onPress={() => order.move([index], direction < 0 ? index - 1 : index + 2)}
              style={({ pressed }) => ({ minHeight: 44, minWidth: 44, opacity: disabled ? 0.3 : pressed ? 0.6 : 1, justifyContent: 'center', alignItems: 'center' })}>
              <Icon name={{ ios: direction < 0 ? 'arrow.up' : 'arrow.down', android: direction < 0 ? 'arrow_upward' : 'arrow_downward', web: direction < 0 ? 'arrow_upward' : 'arrow_downward' }} />
            </Pressable>;
          })}
        </View>
      </View>)}
      {!order.items.length && <Text style={{ padding: 20, color: theme.muted }}>Connect to a mixer and choose a monitor mix to reorder channels.</Text>}
    </Section>
  </ScrollView>;
}
