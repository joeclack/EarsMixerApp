import { View, useWindowDimensions } from 'react-native';
import { useSession } from '../mixer/context';
import { MixerAuxMenu, MixerModeMenu, MixerRailControl, MixerToolsMenu } from './MixerControls.android';

export default function LandscapeMixerToolbar({ top, bottom }: { top: number; bottom: number }) {
  const { state, mix } = useSession();
  const { height } = useWindowDimensions();
  const compact = height - top - bottom < 236;
  const aux = mix.config?.aux.find(item => item.channel === mix.aux);
  return <View style={{ width: 72, flexShrink: 0, paddingTop: top, paddingBottom: bottom,
    alignItems: 'center', justifyContent: 'center', gap: compact ? 4 : 8 }}>
    {!!state.server && <>
      <MixerRailControl label={compact ? undefined : aux?.label || 'Choose AUX'}><MixerAuxMenu rail /></MixerRailControl>
      <MixerRailControl label={compact ? undefined : mix.parameter === 'pan' ? 'Pan' : 'Level'}><MixerModeMenu rail /></MixerRailControl>
    </>}
    <MixerRailControl label={compact ? undefined : mix.locked ? 'Locked' : 'Tools'}><MixerToolsMenu rail /></MixerRailControl>
  </View>;
}
