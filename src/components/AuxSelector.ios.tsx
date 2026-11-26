import { useEffect, useState } from 'react';
import { Platform, Text as RNText, View, useWindowDimensions } from 'react-native';
import { Host } from '@expo/ui';
import { router } from 'expo-router';
import { BottomSheet, Button, HStack, Image, List, Section, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { accessibilityAddTraits, accessibilityLabel, buttonBorderShape, buttonStyle, controlSize, disabled, font, foregroundStyle,
  frame, layoutPriority, lineLimit, listRowBackground, padding, presentationBackground, presentationDetents, presentationDragIndicator,
  scrollContentBackground, tint } from '@expo/ui/swift-ui/modifiers';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { useToolbarHaptic } from './useToolbarHaptic';

const HEIGHT = 48, ICON = 17, CHEVRON = 10, GAP = 8, PADDING = 26;

// The current mix stays visible while its controls are unavailable.
export default function AuxSelector() {
  const { session, state, mix } = useSession(), theme = useTheme();
  const haptic = useToolbarHaptic();
  const { width: screenWidth } = useWindowDimensions();
  const [textWidth, setTextWidth] = useState(0);
  const [presented, setPresented] = useState(false);
  const auxes = mix.config?.aux || [];
  const selected = auxes.find(aux => aux.channel === mix.aux);
  const name = selected?.label || (state.server ? 'No AUX' : 'Mixer');
  const unavailable = !state.server || !auxes.length || mix.status !== 'connected';
  useEffect(() => { if (unavailable) setPresented(false); }, [unavailable]);
  const status = !state.demo && !!mix.config && mix.status !== 'connected'
    ? (state.pinPrompt ? 'PIN needed' : 'Reconnecting…')
    : '';
  // The capsule gets an explicit size from the name's measured width, rather than
  // measuring itself while the header reappears after rotation, and ignores the
  // safe area so a stale landscape inset cannot offset it.
  const maxText = Math.max(80, Math.min(220, screenWidth - 215));
  const label = Math.min(maxText, Math.max(status ? 116 : 0, Math.ceil(textWidth) + 4));
  const width = PADDING * 2 + ICON + CHEVRON + GAP * 2 + label;
  const pick = (aux: number | null) => {
    setPresented(false);
    if (!unavailable) session.preferences({ selectedAux: aux });
  };
  return <View style={{ width, height: HEIGHT }}>
    {/* Measure the name at its natural width, outside the capsule's own frame. */}
    <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden
      style={{ position: 'absolute', left: 0, top: 0, width: 1000, flexDirection: 'row', opacity: 0 }}>
      <RNText numberOfLines={1} onLayout={event => setTextWidth(event.nativeEvent.layout.width)}
        style={{ fontSize: 17, fontWeight: '600' }}>{name}</RNText>
    </View>
    {textWidth > 0 && <Host colorScheme={theme.scheme} ignoreSafeArea="all" style={{ width, height: HEIGHT }}>
      <BottomSheet isPresented={presented && !unavailable} onIsPresentedChange={setPresented}
        anchor={<Button onPress={() => {
          haptic();
          if (status) router.push(state.pinPrompt ? '/pin' : '/settings');
          else setPresented(true);
        }}
          modifiers={[buttonStyle(Number(Platform.Version) >= 26 ? 'glass' : 'bordered'), buttonBorderShape('capsule'), controlSize('large'),
            tint(theme.text), disabled(unavailable && !status), frame({ width, height: HEIGHT }),
            accessibilityLabel(status ? name + ', ' + status : 'Choose monitor mix, ' + name)]}>
          <HStack spacing={GAP}>
            <Image systemName="headphones" size={ICON} color={theme.tint} />
            <VStack alignment="leading" spacing={0} modifiers={[layoutPriority(1)]}>
              <Text modifiers={[font({ weight: 'semibold' }), lineLimit(1)]}>{name}</Text>
              {!!status && <Text modifiers={[font({ textStyle: 'caption2', weight: 'semibold' }), foregroundStyle(theme.orange), lineLimit(1)]}>{status}</Text>}
            </VStack>
            <Image systemName={status ? 'chevron.right' : 'chevron.down'} size={CHEVRON} color={theme.muted} />
          </HStack>
        </Button>}>
        <List modifiers={[scrollContentBackground('hidden'), presentationDetents(['medium', 'large']),
          presentationBackground(theme.bg), presentationDragIndicator('visible')]}>
          <Section header={<HStack modifiers={[padding({ top: 18 })]}>
            <Text modifiers={[font({ textStyle: 'headline' }), foregroundStyle(theme.text)]}>Choose monitor mix</Text>
            <Spacer />
            <Button label="Cancel" onPress={() => setPresented(false)} modifiers={[buttonStyle('borderless'), tint(theme.tint)]} />
          </HStack>}>
            {[{ channel: null, label: 'No AUX' }, ...auxes].map(aux => <Button key={aux.channel ?? 'none'} onPress={() => pick(aux.channel)}
              modifiers={[listRowBackground(theme.panel), ...(mix.aux === aux.channel ? [accessibilityAddTraits(['isSelected'])] : [])]}>
              <HStack spacing={12}>
                <Text modifiers={[foregroundStyle(theme.text)]}>{aux.label}</Text>
                <Spacer />
                {mix.aux === aux.channel && <Image systemName="checkmark" size={16} color={theme.tint} />}
              </HStack>
            </Button>)}
          </Section>
        </List>
      </BottomSheet>
    </Host>}
  </View>;
}
