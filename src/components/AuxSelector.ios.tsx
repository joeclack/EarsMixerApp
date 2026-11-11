import { useState } from 'react';
import { Platform, Text as RNText, View } from 'react-native';
import { Host } from '@expo/ui';
import { HStack, Image, Menu, Picker, Text } from '@expo/ui/swift-ui';
import { accessibilityLabel, buttonBorderShape, buttonStyle, controlSize, disabled, font, frame, lineLimit, menuIndicator, menuStyle, pickerStyle, tag, tint } from '@expo/ui/swift-ui/modifiers';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { useToolbarHaptic } from './useToolbarHaptic';

const MAX_TEXT = 170, HEIGHT = 48, ICON = 17, GAP = 8, PADDING = 20;

// The mixer header's leading control: a native capsule showing the current AUX
// that opens the AUX list, in place of a static title.
export default function AuxSelector() {
  const { session, state, mix } = useSession(), theme = useTheme();
  const haptic = useToolbarHaptic();
  const [textWidth, setTextWidth] = useState(0);
  const auxes = mix.config?.aux || [];
  const selected = auxes.find(aux => aux.channel === mix.aux);
  const name = selected?.label || (state.server ? 'Choose mix' : 'Mixer');
  const unavailable = !state.server || !auxes.length || mix.status !== 'connected';
  // The capsule gets an explicit size from the name's measured width, rather than
  // measuring itself while the header reappears after rotation, and ignores the
  // safe area so a stale landscape inset cannot offset it.
  const label = Math.min(MAX_TEXT, Math.ceil(textWidth));
  const width = PADDING * 2 + ICON + GAP + label;
  return <View onTouchStart={unavailable ? undefined : haptic} style={{ width, height: HEIGHT }}>
    <RNText numberOfLines={1} accessible={false} onLayout={event => setTextWidth(event.nativeEvent.layout.width)}
      style={{ position: 'absolute', opacity: 0, fontSize: 17, fontWeight: '600' }}>{name}</RNText>
    {textWidth > 0 && <Host colorScheme={theme.scheme} ignoreSafeArea="all" style={{ width, height: HEIGHT }}>
      <Menu label={<HStack spacing={GAP}>
          <Image systemName="headphones" size={ICON} color={theme.tint} />
          <Text modifiers={[font({ weight: 'semibold' }), lineLimit(1), frame({ maxWidth: MAX_TEXT })]}>{name}</Text>
        </HStack>}
        modifiers={[menuStyle('button'), buttonStyle(Number(Platform.Version) >= 26 ? 'glass' : 'bordered'), buttonBorderShape('capsule'),
          controlSize('large'), menuIndicator('hidden'), tint(theme.text), disabled(unavailable), frame({ width, height: HEIGHT }),
          accessibilityLabel('Choose AUX, ' + name)]}>
        <Picker label="Choose AUX" selection={mix.aux ?? undefined} onSelectionChange={value => { if (typeof value === 'number') session.preferences({ selectedAux: value }); }}
          modifiers={[pickerStyle('inline')]}>
          {auxes.map(aux => <Text key={aux.channel} modifiers={[tag(aux.channel)]}>{aux.label}</Text>)}
        </Picker>
      </Menu>
    </Host>}
  </View>;
}
