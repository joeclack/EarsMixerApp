import { Children, Fragment, type PropsWithChildren, type ReactNode } from 'react';
import { Text as RNText, View } from 'react-native';
import { Host } from '@expo/ui';
import { Column, HorizontalDivider, IconButton, ListItem, OutlinedCard, RNHostView, Text } from '@expo/ui/jetpack-compose';
import { clickable, fillMaxWidth, semantics } from '@expo/ui/jetpack-compose/modifiers';
import type { SymbolViewProps } from 'expo-symbols';
import { Icon } from './ui';
import { hardwarePalette } from './hardwarePalette';
import { useTheme } from '../theme';

// A Material Symbols name, as used for the Android side of Icon.
type MaterialSymbol = string;
const android = (symbol: MaterialSymbol) => ({ android: symbol }) as SymbolViewProps['name'];

// The Android counterpart of the iOS hardware sections: a titled outlined
// Material card in the console palette, holding native list rows with dividers.
export function MaterialSection({ title, symbol, footer, children }: PropsWithChildren<{ title?: string; symbol?: MaterialSymbol; footer?: string }>) {
  const theme = useTheme(), palette = hardwarePalette(theme.dark);
  const rows = Children.toArray(children).filter(Boolean);
  return <View style={{ marginBottom: 24 }}>
    {!!title && <MaterialSectionTitle title={title} symbol={symbol} />}
    {!!rows.length && <Host matchContents={{ vertical: true }} colorScheme={theme.scheme} seedColor={theme.tint} style={{ alignSelf: 'stretch' }}>
      <OutlinedCard colors={{ containerColor: palette.surface }} border={{ color: palette.edge, width: 1 }} modifiers={[fillMaxWidth()]}>
        <Column modifiers={[fillMaxWidth()]}>
          {rows.map((row, index) => <Fragment key={index}>
            {index > 0 && <HorizontalDivider color={palette.edge} />}
            {row}
          </Fragment>)}
        </Column>
      </OutlinedCard>
    </Host>}
    {!!footer && <RNText style={{ color: theme.muted, fontSize: 13, lineHeight: 19, marginTop: 8, marginHorizontal: 16 }}>{footer}</RNText>}
  </View>;
}

export function MaterialSectionTitle({ title, symbol }: { title: string; symbol?: MaterialSymbol }) {
  const theme = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 16, marginBottom: 8 }}>
    {!!symbol && <Icon name={android(symbol)} size={16} />}
    <RNText accessibilityRole="header" style={{ color: theme.tint, fontSize: 14, fontWeight: '600' }}>{title}</RNText>
  </View>;
}

// One native list row. Only use inside MaterialSection.
export function MaterialItem({ title, detail, symbol, trailing, onPress, destructive, disabled, tint }: {
  title: string; detail?: string; symbol?: MaterialSymbol; trailing?: ReactNode; onPress?: () => void; destructive?: boolean; disabled?: boolean; tint?: boolean;
}) {
  const theme = useTheme(), palette = hardwarePalette(theme.dark);
  const color = destructive ? theme.danger : tint ? theme.tint : theme.text;
  return <ListItem colors={{ containerColor: palette.surface }}
    modifiers={[...(onPress && !disabled ? [clickable(onPress)] : []), semantics({ contentDescription: detail ? title + ', ' + detail : title })]}>
    <ListItem.HeadlineContent><Text color={disabled ? theme.muted : color}>{title}</Text></ListItem.HeadlineContent>
    {!!detail && <ListItem.SupportingContent><Text color={theme.muted}>{detail}</Text></ListItem.SupportingContent>}
    {!!symbol && <ListItem.LeadingContent><MaterialIcon symbol={symbol} color={destructive ? theme.danger : theme.tint} /></ListItem.LeadingContent>}
    {!!trailing && <ListItem.TrailingContent>{trailing}</ListItem.TrailingContent>}
  </ListItem>;
}

export function MaterialIcon({ symbol, color, size = 22 }: { symbol: MaterialSymbol; color?: string; size?: number }) {
  return <RNHostView matchContents><Icon name={android(symbol)} size={size} color={color} /></RNHostView>;
}

export function MaterialIconButton({ symbol, label, onPress, disabled, color }: { symbol: MaterialSymbol; label: string; onPress(): void; disabled?: boolean; color?: string }) {
  const theme = useTheme();
  return <IconButton enabled={!disabled} onClick={onPress} modifiers={[semantics({ contentDescription: label })]}>
    <MaterialIcon symbol={symbol} color={disabled ? theme.muted : color} />
  </IconButton>;
}
