import { Host } from '@expo/ui';
import { List, Text, Toggle, HStack, VStack, Spacer, Image, Button } from '@expo/ui/swift-ui';
import { accessibilityLabel, buttonStyle, environment, font, foregroundStyle, labelsHidden, lineLimit, scrollContentBackground, listRowBackground, listRowSeparatorTint } from '@expo/ui/swift-ui/modifiers';
import { useTheme } from '../theme';
import { hardwarePalette } from './hardwarePalette';
import Section from './HardwareSection.ios';
import { useChannelOrder } from './useChannelOrder';

export default function ChannelOrder() {
  const order = useChannelOrder(), theme = useTheme(), palette = hardwarePalette(theme.dark);
  return <Host style={{ flex: 1 }} colorScheme={theme.scheme}>
    <List modifiers={[environment('editMode', 'active'), scrollContentBackground('hidden')]}>
      {!!order.error && <Section><Text modifiers={[foregroundStyle(theme.danger)]}>{order.error}</Text></Section>}
      <Section footer="Drag to reorder channels or whole groups. Show/hide applies to the entire group. Edit a group to change its members and their order. Layout order is shared across monitor mixes.">
        <List.ForEach data={order.items} keyExtractor={item => String(item.key)} onMove={order.move}>
          {({ item }) => <HStack spacing={10} modifiers={[listRowBackground(palette.surface), listRowSeparatorTint(palette.edge)]}>
            {item.group && <Image systemName="link" size={16} color={theme.tint} />}
            <VStack alignment="leading" spacing={4}>
              <Text modifiers={[lineLimit(2), foregroundStyle(theme.text)]}>{item.label}</Text>
              {!!item.detail && <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(theme.muted)]}>{item.detail}</Text>}
            </VStack>
            <Spacer />
            {item.group && <Button label="Edit" onPress={() => order.edit(item.group!.id)}
              modifiers={[buttonStyle('borderless'), accessibilityLabel('Edit ' + item.label + ' group')]} />}
            <Toggle label={'Show ' + item.label} isOn={item.visible} onIsOnChange={visible => order.show(item.key, visible)} modifiers={[labelsHidden()]} />
          </HStack>}
        </List.ForEach>
        {!order.items.length && <Text>Connect to a mixer and choose a monitor mix to reorder channels.</Text>}
      </Section>
    </List>
  </Host>;
}
