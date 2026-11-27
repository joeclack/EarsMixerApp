import { ScrollView } from 'react-native';
import { Row, Switch } from '@expo/ui/jetpack-compose';
import { semantics } from '@expo/ui/jetpack-compose/modifiers';
import { Message } from './ui';
import { useChannelOrder } from './useChannelOrder';
import { MaterialIconButton, MaterialItem, MaterialSection } from './MaterialList.android';
import { useAndroidTabBarInset } from './useAndroidTabBarInset';

// Native Material rows mirroring the iOS channel order list: show/hide with a
// switch and move with arrow buttons. Tapping a group row opens its editor.
export default function ChannelOrder() {
  const order = useChannelOrder();
  // Room to scroll the last row clear of the floating tab bar.
  const tabBarInset = useAndroidTabBarInset('channels');
  return <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 20 + tabBarInset }}>
    <Message error>{order.error}</Message>
    <MaterialSection title={order.mixName ? 'Shown in ' + order.mixName : undefined}>
      {order.items.map((item, index) => <MaterialItem key={item.key} title={item.label} detail={item.detail || undefined}
        symbol={item.group ? 'link' : undefined} onPress={item.group ? () => order.edit(item.group!.id) : undefined}
        trailing={<Row verticalAlignment="center">
          <MaterialIconButton symbol="arrow_upward" label={'Move ' + item.label + ' up'} disabled={index === 0} onPress={() => order.move([index], index - 1)} />
          <MaterialIconButton symbol="arrow_downward" label={'Move ' + item.label + ' down'} disabled={index === order.items.length - 1} onPress={() => order.move([index], index + 2)} />
          <Switch value={item.visible} onCheckedChange={visible => order.show(item.key, visible)} modifiers={[semantics({ contentDescription: 'Show ' + item.label })]} />
        </Row>} />)}
      {!order.items.length && <MaterialItem title="No channels" detail="Connect to a mixer and choose a monitor mix to reorder channels." />}
    </MaterialSection>
  </ScrollView>;
}
