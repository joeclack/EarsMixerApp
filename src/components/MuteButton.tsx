import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFaderSession } from '../mixer/context';
import { levelText } from '../mixer/model';
import { useTheme } from '../theme';
import { Icon } from './ui';

const MUTE_RED = '#FF453A';

function useMute(channel: number) {
  const { session } = useFaderSession(channel);
  const mixer = session.mixer;
  const muted = mixer.isMuted(channel);
  const toggle = () => {
    if (!mixer.setMuted(channel, !muted)) return;
    if (session.state.settings.haptics) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };
  return { muted, available: mixer.canMute(channel), toggle };
}

// Mutes the channel in this mix only: the desk turns its send to this AUX off
// and keeps the level, so unmuting brings back exactly what was there.
export const MuteButton = memo(function MuteButton({ channel, label }: { channel: number; label: string }) {
  const theme = useTheme();
  const { muted, available, toggle } = useMute(channel);
  if (!available && !muted) return null;
  return <Pressable accessibilityRole="switch" accessibilityLabel={'Mute ' + label} accessibilityState={{ checked: muted, disabled: !available }}
    disabled={!available} onPress={toggle} hitSlop={8}
    style={({ pressed }) => ({ width: 36, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
      backgroundColor: muted ? MUTE_RED : 'transparent', borderWidth: 1, borderColor: muted ? MUTE_RED : theme.line, opacity: pressed ? 0.7 : 1 })}>
    <Icon name={{ ios: muted ? 'speaker.slash.fill' : 'speaker.wave.2', android: muted ? 'volume_off' : 'volume_up', web: muted ? 'volume_off' : 'volume_up' }}
      size={15} color={muted ? '#FFFFFF' : theme.muted} />
  </Pressable>;
});

// Landscape: the level above each strip doubles as its mute button.
export const LevelMuteToggle = memo(function LevelMuteToggle({ channel, label, height }: { channel: number; label: string; height: number }) {
  const theme = useTheme();
  const { session, mix } = useFaderSession(channel);
  const { muted, available, toggle } = useMute(channel);
  const value = levelText(session.mixer.displayValue(channel), mix.parameter);
  return <Pressable accessibilityRole="switch" accessibilityLabel={'Mute ' + label} accessibilityValue={{ text: value }}
    accessibilityState={{ checked: muted, disabled: !available }} disabled={!available} onPress={toggle} hitSlop={{ top: 8, bottom: 4, left: 4, right: 4 }}
    style={({ pressed }) => ({ height, minWidth: 64, paddingHorizontal: 8, borderRadius: height / 2, alignItems: 'center', justifyContent: 'center',
      backgroundColor: muted ? MUTE_RED : 'transparent', opacity: pressed ? 0.7 : 1 })}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {muted && <Icon name={{ ios: 'speaker.slash.fill', android: 'volume_off', web: 'volume_off' }} size={11} color="#FFFFFF" />}
      <Text numberOfLines={1} style={{ color: muted ? '#FFFFFF' : theme.muted, fontSize: 13, lineHeight: 18, fontWeight: muted ? '700' : '500', fontVariant: ['tabular-nums'] }}>
        {muted ? 'Muted' : value}</Text>
    </View>
  </Pressable>;
});
