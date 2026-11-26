import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Host } from '@expo/ui';
import { Column, DropdownMenu, DropdownMenuItem, LazyColumn, ListItem, ModalBottomSheet, RNHostView, Row, SelectableDropdownMenuItem,
  Text as MaterialText, TextButton, type ModalBottomSheetRef } from '@expo/ui/jetpack-compose';
import { clickable, fillMaxWidth, padding, semantics, weight } from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import type { SymbolViewProps } from 'expo-symbols';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { Icon } from './ui';
import { useSetAllLevelsOff } from './useSetAllLevelsOff';

type Symbol = NonNullable<Extract<SymbolViewProps['name'], { android?: unknown }>['android']>;
type MenuItem = { id: string | number; label: string; onPress(): void; selected?: boolean; disabled?: boolean; destructive?: boolean };

function MixerMenu({ label, symbol, text, maxWidth, rail, disabled, highlighted, items }: {
  label: string; symbol?: Symbol; text?: string; maxWidth?: number; rail?: boolean;
  disabled?: boolean; highlighted?: boolean; items: MenuItem[];
}) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const color = disabled ? theme.muted : theme.tint;
  return <Host matchContents colorScheme={theme.scheme} seedColor={theme.tint}>
    <DropdownMenu expanded={!disabled && expanded} onDismissRequest={() => setExpanded(false)} color={theme.panel}>
      <DropdownMenu.Trigger>
        <RNHostView matchContents>
          <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, expanded: !disabled && expanded }}
            disabled={disabled} onPress={() => setExpanded(true)} android_ripple={{ color: theme.line }}
            style={{ minWidth: 48, minHeight: 48, maxWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
              paddingHorizontal: text ? 10 : 0, borderRadius: 24, overflow: 'hidden',
              backgroundColor: highlighted ? theme.secondary : rail ? theme.panel : 'transparent' }}>
            {!!symbol && <Icon name={{ android: symbol }} size={20} color={color} />}
            {!!text && <Text numberOfLines={1} style={{ flexShrink: 1, color: disabled ? theme.muted : theme.text, fontSize: 15, fontWeight: '600' }}>{text}</Text>}
            {!!text && <Icon name={{ android: 'arrow_drop_down' }} size={18} color={color} />}
          </Pressable>
        </RNHostView>
      </DropdownMenu.Trigger>
      <DropdownMenu.Items>
        {items.map(item => {
          const onClick = () => { setExpanded(false); item.onPress(); };
          if (item.selected !== undefined) return <SelectableDropdownMenuItem key={item.id} selected={item.selected} onClick={onClick}
            colors={{ selectedContainerColor: theme.secondary }}>
            <SelectableDropdownMenuItem.Text><MaterialText color={theme.text}>{item.label}</MaterialText></SelectableDropdownMenuItem.Text>
            <SelectableDropdownMenuItem.SelectedLeadingIcon><RNHostView matchContents><Icon name={{ android: 'check' }} size={20} /></RNHostView></SelectableDropdownMenuItem.SelectedLeadingIcon>
          </SelectableDropdownMenuItem>;
          return <DropdownMenuItem key={item.id} enabled={!item.disabled} onClick={onClick}>
            <DropdownMenuItem.Text><MaterialText color={item.disabled ? theme.muted : item.destructive ? theme.danger : theme.text}>{item.label}</MaterialText></DropdownMenuItem.Text>
          </DropdownMenuItem>;
        })}
      </DropdownMenu.Items>
    </DropdownMenu>
  </Host>;
}

export function MixerAuxMenu({ rail, maxWidth }: { rail?: boolean; maxWidth?: number }) {
  const { session, state, mix } = useSession();
  const theme = useTheme();
  const [presented, setPresented] = useState(false);
  const sheet = useRef<ModalBottomSheetRef>(null);
  const auxes = mix.config?.aux || [];
  const label = auxes.find(aux => aux.channel === mix.aux)?.label || 'No AUX';
  const unavailable = !state.server || !auxes.length || mix.status !== 'connected';
  const status = !state.demo && !!mix.config && mix.status !== 'connected'
    ? (state.pinPrompt ? 'PIN needed' : 'Reconnecting…')
    : '';
  const disabled = unavailable && !status;
  const iconColor = disabled ? theme.muted : status ? theme.orange : theme.tint;
  useEffect(() => { if (unavailable) setPresented(false); }, [unavailable]);
  const dismiss = () => {
    const hide = sheet.current?.hide();
    if (hide) void hide.finally(() => setPresented(false)).catch(() => {});
    else setPresented(false);
  };
  const pick = (channel: number | null) => {
    if (session.state.server === state.server && session.mixer.state.status === 'connected') session.preferences({ selectedAux: channel });
    dismiss();
  };
  return <Host matchContents colorScheme={theme.scheme} seedColor={theme.tint}>
    <RNHostView matchContents>
      <Pressable accessibilityRole="button" accessibilityLabel={status ? label + ', ' + status : 'Choose monitor mix, ' + label}
        accessibilityState={{ disabled, expanded: presented && !unavailable }} disabled={disabled}
        onPress={() => { if (status) router.push(state.pinPrompt ? '/pin' : '/settings'); else setPresented(true); }}
        android_ripple={{ color: theme.line }} style={{ minWidth: 48, minHeight: 48, maxWidth, flexDirection: 'row',
          alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: rail ? 0 : 10, borderRadius: 24,
          overflow: 'hidden', backgroundColor: rail ? theme.panel : 'transparent' }}>
        <Icon name={{ android: 'headphones' }} size={20} color={iconColor} />
        {!rail && <>
          <View style={{ flexShrink: 1 }}>
            <Text numberOfLines={1} style={{ color: disabled ? theme.muted : theme.text, fontSize: 15, fontWeight: '600' }}>{label}</Text>
            {!!status && <Text numberOfLines={1} style={{ color: theme.orange, fontSize: 11, fontWeight: '600' }}>{status}</Text>}
          </View>
          <Icon name={{ android: status ? 'chevron_right' : 'arrow_drop_down' }} size={18} color={iconColor} />
        </>}
      </Pressable>
    </RNHostView>
    {presented && !unavailable && <ModalBottomSheet ref={sheet} onDismissRequest={() => setPresented(false)}
      containerColor={theme.panel} contentColor={theme.text}>
      <Column modifiers={[fillMaxWidth()]}>
        <Row verticalAlignment="center" modifiers={[fillMaxWidth(), padding(20, 4, 12, 8)]}>
          <MaterialText style={{ typography: 'titleLarge' }} modifiers={[weight(1)]}>Choose monitor mix</MaterialText>
          <TextButton onClick={dismiss}><MaterialText color={theme.tint}>Cancel</MaterialText></TextButton>
        </Row>
        <LazyColumn contentPadding={{ bottom: 12 }}>
          {[{ channel: null, label: 'No AUX' }, ...auxes].map(aux => {
            const selected = mix.aux === aux.channel;
            return <ListItem key={aux.channel ?? 'none'} colors={{ containerColor: selected ? theme.secondary : theme.panel }}
              modifiers={[clickable(() => pick(aux.channel)), semantics({ contentDescription: selected ? aux.label + ', selected' : aux.label })]}>
              <ListItem.HeadlineContent><MaterialText color={theme.text}>{aux.label}</MaterialText></ListItem.HeadlineContent>
              {selected && <ListItem.TrailingContent><RNHostView matchContents><Icon name={{ android: 'check' }} size={20} /></RNHostView></ListItem.TrailingContent>}
            </ListItem>;
          })}
        </LazyColumn>
      </Column>
    </ModalBottomSheet>}
  </Host>;
}

export function MixerModeMenu({ rail }: { rail?: boolean }) {
  const { session, mix } = useSession();
  const pan = mix.parameter === 'pan';
  const label = pan ? 'Pan' : 'Level';
  const symbol = pan ? 'swap_horiz' : 'volume_up';
  return <MixerMenu label={'Fader mode. ' + label} symbol={rail ? symbol : undefined} rail={rail}
    text={rail ? undefined : label} maxWidth={112} highlighted={pan}
    items={(['level', 'pan'] as const).map(mode => ({ id: mode, label: mode === 'level' ? 'Level' : 'Pan',
      selected: mix.parameter === mode, onPress: () => session.mixer.setParameter(mode) }))} />;
}

export function MixerToolsMenu({ rail }: { rail?: boolean }) {
  const { session, state, mix } = useSession();
  const setAllLevelsOff = useSetAllLevelsOff();
  const items: MenuItem[] = state.server ? [
    { id: 'lock', label: mix.locked ? 'Unlock faders' : 'Lock faders', onPress: () => session.mixer.setLocked(!mix.locked) },
    { id: 'request', label: 'Message the engineer', disabled: mix.status !== 'connected', onPress: () => router.push('/request') },
  ] : [];
  if (rail) items.push(
    { id: 'channels', label: 'Channels', onPress: () => router.navigate('/channels') },
    { id: 'settings', label: 'Settings', onPress: () => router.navigate('/settings') },
  );
  if (state.server) items.push({ id: 'off', label: 'Set all levels to off', destructive: true,
    disabled: mix.status !== 'connected' || !mix.aux || mix.locked, onPress: setAllLevelsOff });
  return <MixerMenu label={mix.locked ? 'Mixer tools. Faders locked' : 'Mixer tools'} symbol={mix.locked ? 'lock' : 'more_vert'}
    rail={rail} highlighted={mix.locked} items={items} />;
}

export function MixerRailControl({ label, children }: PropsWithChildren<{ label?: string }>) {
  const theme = useTheme();
  return <View style={{ alignItems: 'center', gap: 2 }}>
    {children}
    {!!label && <Text importantForAccessibility="no" numberOfLines={1} style={{ maxWidth: 68, color: theme.text, fontSize: 11, fontWeight: '600', textAlign: 'center' }}>{label}</Text>}
  </View>;
}
