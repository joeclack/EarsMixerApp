import { Platform, Text as RNText, View } from 'react-native';
import { Host } from '@expo/ui';
import { Button, Menu, Picker, Text, Image } from '@expo/ui/swift-ui';
import { accessibilityLabel, buttonBorderShape, buttonStyle, disabled, frame, menuStyle, pickerStyle, tag, tint } from '@expo/ui/swift-ui/modifiers';
import { useTheme } from '../theme';
import type { LandscapeFaderActionsProps } from './LandscapeFaderActions';
import { useToolbarHaptic } from './useToolbarHaptic';

export default function LandscapeFaderActions({ parameter, disabled: unavailable, offDisabled, onModeChange, onAllOff }: LandscapeFaderActionsProps) {
  const theme = useTheme();
  const haptic = useToolbarHaptic();
  const style = buttonStyle(Number(Platform.Version) >= 26 ? 'glass' : 'bordered');
  return <View style={{ width: 64, alignItems: 'center', gap: 10 }}>
    <View onTouchStart={unavailable ? undefined : haptic}>
    <Host colorScheme={theme.scheme} ignoreSafeArea="all" style={{ width: 64, height: 64 }}>
      <Menu label={<Image systemName="slider.horizontal.3" size={22} modifiers={[frame({ width: 44, height: 44 })]} />}
        modifiers={[menuStyle('button'), style, buttonBorderShape('circle'), frame({ width: 64, height: 64 }), tint(theme.tint), disabled(unavailable), accessibilityLabel('Fader mode, ' + parameter)]}>
        <Picker label="Fader mode" selection={parameter} onSelectionChange={value => { if (value === 'level' || value === 'pan') onModeChange(value); }} modifiers={[pickerStyle('inline')]}>
          <Text modifiers={[tag('level')]}>Level</Text><Text modifiers={[tag('pan')]}>Pan</Text>
        </Picker>
      </Menu>
    </Host>
    </View>
      <RNText style={{ color: theme.muted, fontSize: 11, lineHeight: 15 }}>{parameter === 'level' ? 'Level' : 'Pan'}</RNText>
    <Host colorScheme={theme.scheme} ignoreSafeArea="all" style={{ width: 64, height: 64 }}>
      <Button role="destructive" onPress={() => { haptic(); onAllOff(); }}
        modifiers={[style, buttonBorderShape('circle'), frame({ width: 64, height: 64 }), tint(theme.danger), disabled(offDisabled), accessibilityLabel('Set all levels to off')]}>
        <Image systemName="infinity" size={22} modifiers={[frame({ width: 44, height: 44 })]} />
      </Button>
    </Host>
  </View>;
}
