import { useState, type PropsWithChildren } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Host } from '@expo/ui';
import { DropdownMenu, DropdownMenuItem, RNHostView, SelectableDropdownMenuItem, Text as MaterialText } from '@expo/ui/jetpack-compose';
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
  const auxes = mix.config?.aux || [];
  const label = auxes.find(aux => aux.channel === mix.aux)?.label || 'Choose AUX';
  return <MixerMenu label={'Choose AUX. ' + (mix.aux === null ? 'No AUX selected' : label)} symbol="headphones"
    rail={rail} text={rail ? undefined : label} maxWidth={maxWidth}
    disabled={!state.server || !auxes.length || mix.status !== 'connected'}
    items={[{ id: 'none', label: 'No AUX', selected: mix.aux === null, onPress: () => session.preferences({ selectedAux: null }) },
      ...auxes.map(aux => ({ id: aux.channel, label: aux.label, selected: mix.aux === aux.channel, onPress: () => session.preferences({ selectedAux: aux.channel }) }))]} />;
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
