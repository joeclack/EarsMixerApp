import { Platform, View } from 'react-native';
import { Host } from '@expo/ui';
import { HStack, Image, Menu, Picker, Text } from '@expo/ui/swift-ui';
import { accessibilityLabel, buttonBorderShape, buttonStyle, controlSize, disabled, font, frame, lineLimit, menuIndicator, menuStyle, pickerStyle, tag, tint } from '@expo/ui/swift-ui/modifiers';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { useToolbarHaptic } from './useToolbarHaptic';

// The mixer header's leading control: a native capsule showing the current AUX
// that opens the AUX list, in place of a static title.
export default function AuxSelector() {
  const { session, state, mix } = useSession(), theme = useTheme();
  const haptic = useToolbarHaptic();
  const auxes = mix.config?.aux || [];
  const selected = auxes.find(aux => aux.channel === mix.aux);
  const name = selected?.label || (state.server ? 'Choose mix' : 'Mixer');
  const unavailable = !state.server || !auxes.length || mix.status !== 'connected';
  return <View onTouchStart={unavailable ? undefined : haptic}><Host matchContents colorScheme={theme.scheme}>
    <Menu label={<HStack spacing={8}>
        <Image systemName="headphones" size={17} color={theme.tint} />
        <Text modifiers={[font({ weight: 'semibold' }), lineLimit(1), frame({ maxWidth: 170 })]}>{name}</Text>
      </HStack>}
      modifiers={[menuStyle('button'), buttonStyle(Number(Platform.Version) >= 26 ? 'glass' : 'bordered'), buttonBorderShape('capsule'),
        controlSize('large'), menuIndicator('hidden'), tint(theme.text), disabled(unavailable), accessibilityLabel('Choose AUX, ' + name)]}>
      <Picker label="Choose AUX" selection={mix.aux ?? undefined} onSelectionChange={value => { if (typeof value === 'number') session.preferences({ selectedAux: value }); }}
        modifiers={[pickerStyle('inline')]}>
        {auxes.map(aux => <Text key={aux.channel} modifiers={[tag(aux.channel)]}>{aux.label}</Text>)}
      </Picker>
    </Menu>
  </Host></View>;
}
