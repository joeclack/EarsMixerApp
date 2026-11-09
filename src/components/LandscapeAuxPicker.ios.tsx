import { Platform } from 'react-native';
import { Host } from '@expo/ui';
import { Menu, Picker, Text, Image } from '@expo/ui/swift-ui';
import { accessibilityLabel, buttonBorderShape, buttonStyle, disabled, frame, menuStyle, pickerStyle, tag, tint } from '@expo/ui/swift-ui/modifiers';
import { useTheme } from '../theme';
import type { LandscapeAuxPickerProps } from './LandscapeAuxPicker';

export default function LandscapeAuxPicker({ auxes, selected, disabled: unavailable, onChange }: LandscapeAuxPickerProps) {
  const theme = useTheme();
  const label = auxes.find(aux => aux.channel === selected)?.label || 'Choose mix';
  return <Host matchContents colorScheme={theme.scheme} style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
    <Menu label={<Image systemName="headphones" size={22} modifiers={[frame({ width: 44, height: 44 })]} />}
      modifiers={[menuStyle('button'), buttonStyle(Number(Platform.Version) >= 26 ? 'glass' : 'bordered'), buttonBorderShape('circle'),
        tint(theme.tint), disabled(unavailable), accessibilityLabel('Choose AUX, ' + label)]}>
      <Picker label="Choose AUX" selection={selected} onSelectionChange={value => { if (typeof value === 'number') onChange(value); }} modifiers={[pickerStyle('inline')]}>
        {auxes.map(aux => <Text key={aux.channel} modifiers={[tag(aux.channel)]}>{aux.label}</Text>)}
      </Picker>
    </Menu>
  </Host>;
}
