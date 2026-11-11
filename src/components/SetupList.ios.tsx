import type { SFSymbol } from 'sf-symbols-typescript';
import { Host, List, HStack, Image, Text, Spacer } from '@expo/ui/swift-ui';
import { foregroundStyle, listRowBackground, listRowSeparatorTint, scrollContentBackground } from '@expo/ui/swift-ui/modifiers';
import Section from './HardwareSection.ios';
import { hardwarePalette } from './hardwarePalette';
import { useTheme } from '../theme';

// A native inset-grouped list of numbered instructions. It fills the space it is
// given and scrolls on its own if the steps do not fit.
export default function SetupList({ items }: { items: string[] }) {
  const theme = useTheme(), palette = hardwarePalette(theme.dark);
  const rowStyle = [listRowBackground(palette.surface), listRowSeparatorTint(palette.edge)];
  return <Host style={{ flex: 1 }} colorScheme={theme.scheme} seedColor={theme.tint}>
    <List modifiers={[scrollContentBackground('hidden')]}>
      <Section>
        {items.map((text, index) => <HStack key={text} spacing={12} modifiers={rowStyle}>
          <Image systemName={`${index + 1}.circle.fill` as SFSymbol} size={22} color={theme.tint} />
          <Text modifiers={[foregroundStyle(theme.text)]}>{text}</Text>
          <Spacer />
        </HStack>)}
      </Section>
    </List>
  </Host>;
}
