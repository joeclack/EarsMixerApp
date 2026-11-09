import { Platform } from 'react-native';
import { Host } from '@expo/ui';
import { Button, Menu, Picker, Text, Image, VStack } from '@expo/ui/swift-ui';
import { accessibilityLabel, buttonBorderShape, buttonStyle, disabled, font, foregroundStyle, frame, labelStyle, menuStyle, pickerStyle, tag, tint } from '@expo/ui/swift-ui/modifiers';
import { useTheme } from '../theme';
import type { LandscapeFaderActionsProps } from './LandscapeFaderActions';

export default function LandscapeFaderActions({ parameter, disabled: unavailable, offDisabled, onModeChange, onAllOff }: LandscapeFaderActionsProps) {
  const theme = useTheme();
  const style = buttonStyle(Number(Platform.Version) >= 26 ? 'glass' : 'bordered');
  return <Host colorScheme={theme.scheme} style={{ width: 64, height: 164 }}>
    <VStack spacing={10}>
      <Menu label={<Image systemName="slider.horizontal.3" size={22} modifiers={[frame({ width: 44, height: 44 })]} />}
        modifiers={[menuStyle('button'), style, buttonBorderShape('circle'), tint(theme.tint), disabled(unavailable), accessibilityLabel('Fader mode, ' + parameter)]}>
        <Picker label="Fader mode" selection={parameter} onSelectionChange={value => { if (value === 'level' || value === 'pan') onModeChange(value); }} modifiers={[pickerStyle('inline')]}>
          <Text modifiers={[tag('level')]}>Level</Text><Text modifiers={[tag('pan')]}>Pan</Text>
        </Picker>
      </Menu>
      <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(theme.muted)]}>{parameter === 'level' ? 'Level' : 'Pan'}</Text>
      <Button label="Set all levels to off" systemImage="infinity" role="destructive" onPress={onAllOff}
        modifiers={[style, buttonBorderShape('circle'), labelStyle('iconOnly'), tint(theme.danger), disabled(offDisabled), frame({ minWidth: 44, minHeight: 44 }), accessibilityLabel('Set all levels to off')]} />
    </VStack>
  </Host>;
}
