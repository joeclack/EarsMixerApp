import { useState } from 'react';
import { Host } from '@expo/ui';
import { DropdownMenu, DropdownMenuItem, IconButton, RNHostView, Text } from '@expo/ui/jetpack-compose';
import { semantics } from '@expo/ui/jetpack-compose/modifiers';
import { Icon } from './ui';
import { useTheme } from '../theme';
import type { LandscapeAuxPickerProps } from './LandscapeAuxPicker';
import { useToolbarHaptic } from './useToolbarHaptic';

export default function LandscapeAuxPicker({ auxes, selected, disabled, onChange }: LandscapeAuxPickerProps) {
  const theme = useTheme(), [expanded, setExpanded] = useState(false);
  const haptic = useToolbarHaptic();
  const label = auxes.find(aux => aux.channel === selected)?.label || 'Choose mix';
  return <Host matchContents colorScheme={theme.scheme} seedColor={theme.tint}>
    <DropdownMenu expanded={!disabled && expanded} onDismissRequest={() => setExpanded(false)} color={theme.panel}>
      <DropdownMenu.Trigger><IconButton enabled={!disabled} onClick={() => { haptic(); setExpanded(true); }} modifiers={[semantics({ contentDescription: 'Choose AUX, ' + label })]}>
        <RNHostView matchContents><Icon name={{ android: 'headphones' }} /></RNHostView>
      </IconButton></DropdownMenu.Trigger>
      <DropdownMenu.Items>{auxes.map(aux => <DropdownMenuItem key={aux.channel} onClick={() => { setExpanded(false); onChange(aux.channel); }}>
        <DropdownMenuItem.Text><Text>{(aux.channel === selected ? '✓ ' : '') + aux.label}</Text></DropdownMenuItem.Text>
      </DropdownMenuItem>)}</DropdownMenu.Items>
    </DropdownMenu>
  </Host>;
}
