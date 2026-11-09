import { Platform } from 'react-native';
import { Host } from '@expo/ui';
import { Button, Menu, Picker, Text, Image, VStack } from '@expo/ui/swift-ui';
import { accessibilityLabel, buttonBorderShape, buttonStyle, disabled, font, foregroundStyle, frame, menuStyle, pickerStyle, tag, tint } from '@expo/ui/swift-ui/modifiers';
import { useTheme } from '../theme';
import type { LandscapeFaderActionsProps } from './LandscapeFaderActions';

export default function LandscapeFaderActions({ parameter, disabled: unavailable, offDisabled, onModeChange, onAllOff }: LandscapeFaderActionsProps) {
  const theme = useTheme();
  const style = buttonStyle(Number(Platform.Version) >= 26 ? 'glass' : 'bordered');
  return <Host colorScheme={theme.scheme} style={{ width: 64, height: 164 }}>
    <VStack spacing={10}>
      <Menu label={<Image systemName="slider.horizontal.3" size={22} modifiers={[frame({ width: 44, height: 44 })]} />}
        modifiers={[menuStyle('button'), style, buttonBorderShape('circle'), frame({ width: 64, height: 64 }), tint(theme.tint), disabled(unavailable), accessibilityLabel('Fader mode, ' + parameter)]}>
        <Picker label="Fader mode" selection={parameter} onSelectionChange={value => { if (value === 'level' || value === 'pan') onModeChange(value); }} modifiers={[pickerStyle('inline')]}>
          <Text modifiers={[tag('level')]}>Level</Text><Text modifiers={[tag('pan')]}>Pan</Text>
        </Picker>
      </Menu>
      <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(theme.muted)]}>{parameter === 'level' ? 'Level' : 'Pan'}</Text>
      <Button role="destructive" onPress={onAllOff}
        modifiers={[style, buttonBorderShape('circle'), frame({ width: 64, height: 64 }), tint(theme.danger), disabled(offDisabled), accessibilityLabel('Set all levels to off')]}>
        <Image systemName="infinity" size={22} modifiers={[frame({ width: 44, height: 44 })]} />
      </Button>
    </VStack>
  </Host>;
}
