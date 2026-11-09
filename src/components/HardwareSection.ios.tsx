import type { PropsWithChildren } from 'react';
import type { SFSymbol } from 'sf-symbols-typescript';
import { Section, HStack, Image, Text } from '@expo/ui/swift-ui';
import { font, foregroundStyle, listRowBackground, listRowSeparatorTint } from '@expo/ui/swift-ui/modifiers';
import { useTheme } from '../theme';
import { hardwarePalette } from './hardwarePalette';

export default function HardwareSection({ title, symbol, children }: PropsWithChildren<{ title?: string; symbol?: SFSymbol }>) {
  const theme = useTheme(), palette = hardwarePalette(theme.dark);
  return <Section modifiers={[listRowBackground(palette.surface), listRowSeparatorTint(palette.edge)]}
    header={title ? <HStack spacing={8}>
      {!!symbol && <Image systemName={symbol} size={13} color={theme.tint} />}
      <Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(theme.muted)]}>{title}</Text>
    </HStack> : undefined}>
    {children}
  </Section>;
}
