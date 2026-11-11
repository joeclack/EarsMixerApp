import { Platform, View } from 'react-native';
import { Host } from '@expo/ui';
import { Menu, Picker, Text, Image } from '@expo/ui/swift-ui';
import { accessibilityLabel, buttonBorderShape, buttonStyle, disabled, frame, menuStyle, pickerStyle, tag, tint } from '@expo/ui/swift-ui/modifiers';
import { useTheme } from '../theme';
import type { LandscapeAuxPickerProps } from './LandscapeAuxPicker';
import { useToolbarHaptic } from './useToolbarHaptic';

// The rail sits inside the left safe-area inset that iOS reserves in landscape
// even on the side without the notch. Without ignoreSafeArea the hosted SwiftUI
// button shifts right of its frame, out of line with the rail labels.
export default function LandscapeAuxPicker({ auxes, selected, disabled: unavailable, onChange }: LandscapeAuxPickerProps) {
  const theme = useTheme();
  const haptic = useToolbarHaptic();
  const label = auxes.find(aux => aux.channel === selected)?.label || 'Choose mix';
  return <View onTouchStart={unavailable ? undefined : haptic}><Host colorScheme={theme.scheme} ignoreSafeArea="all" style={{ width: 64, height: 64 }}>
    <Menu label={<Image systemName="headphones" size={22} modifiers={[frame({ width: 44, height: 44 })]} />}
      modifiers={[menuStyle('button'), buttonStyle(Number(Platform.Version) >= 26 ? 'glass' : 'bordered'), buttonBorderShape('circle'),
        frame({ width: 64, height: 64 }), tint(theme.tint), disabled(unavailable), accessibilityLabel('Choose AUX, ' + label)]}>
      <Picker label="Choose AUX" selection={selected} onSelectionChange={value => { if (typeof value === 'number') onChange(value); }} modifiers={[pickerStyle('inline')]}>
        {auxes.map(aux => <Text key={aux.channel} modifiers={[tag(aux.channel)]}>{aux.label}</Text>)}
      </Picker>
    </Menu>
  </Host></View>;
}
