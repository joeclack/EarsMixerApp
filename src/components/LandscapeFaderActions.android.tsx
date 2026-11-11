import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Host } from '@expo/ui';
import { DropdownMenu, DropdownMenuItem, IconButton, RNHostView, Text as ComposeText } from '@expo/ui/jetpack-compose';
import { semantics } from '@expo/ui/jetpack-compose/modifiers';
import { Icon } from './ui';
import { useTheme } from '../theme';
import { useToolbarHaptic } from './useToolbarHaptic';
import { RailButton } from './LandscapeAuxPicker.android';
import type { LandscapeFaderActionsProps } from './LandscapeFaderActions';

// Level/Pan uses the same Material dropdown as the AUX picker, rather than an alert.
export default function LandscapeFaderActions({ parameter, disabled, offDisabled, onModeChange, onAllOff }: LandscapeFaderActionsProps) {
  const theme = useTheme(), [expanded, setExpanded] = useState(false);
  const haptic = useToolbarHaptic();
  return <View style={{ gap: 10, alignItems: 'center' }}>
    <RailButton disabled={disabled}>
      <Host matchContents colorScheme={theme.scheme} seedColor={theme.tint}>
        <DropdownMenu expanded={!disabled && expanded} onDismissRequest={() => setExpanded(false)} color={theme.panel}>
          <DropdownMenu.Trigger><IconButton enabled={!disabled} onClick={() => { haptic(); setExpanded(true); }}
            modifiers={[semantics({ contentDescription: 'Fader mode, ' + parameter })]}>
            <RNHostView matchContents><Icon name={{ android: 'tune' }} /></RNHostView>
          </IconButton></DropdownMenu.Trigger>
          <DropdownMenu.Items>{(['level', 'pan'] as const).map(mode => <DropdownMenuItem key={mode} onClick={() => { setExpanded(false); onModeChange(mode); }}>
            <DropdownMenuItem.Text><ComposeText>{(mode === parameter ? '✓ ' : '') + (mode === 'level' ? 'Level' : 'Pan')}</ComposeText></DropdownMenuItem.Text>
          </DropdownMenuItem>)}</DropdownMenu.Items>
        </DropdownMenu>
      </Host>
    </RailButton>
    <Text style={{ color: theme.muted, fontSize: 11, textAlign: 'center' }}>{parameter === 'level' ? 'Level' : 'Pan'}</Text>
    <RailButton disabled={offDisabled}>
      <Pressable accessibilityRole="button" accessibilityLabel="Set all levels to off" disabled={offDisabled} onPress={() => { haptic(); onAllOff(); }}
        android_ripple={{ color: theme.line, borderless: true, radius: 24 }} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={{ android: 'all_inclusive' }} color={theme.danger} />
      </Pressable>
    </RailButton>
  </View>;
}
