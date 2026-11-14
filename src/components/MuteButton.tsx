import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFaderSession } from '../mixer/context';
import { useTheme } from '../theme';

const MUTE_RED = '#FF453A';

// A desk-style MUTE key. It mutes the channel in this mix only: the desk turns
// its send to this AUX off and keeps the level, so unmuting restores it exactly.
// Lit red while muted. Hidden until the desk has reported the send's state.
export const MuteKey = memo(function MuteKey({ channel, label, width = 64, height = 26 }: { channel: number; label: string; width?: number; height?: number }) {
  const theme = useTheme();
  const { session } = useFaderSession(channel);
  const mixer = session.mixer;
  const muted = mixer.isMuted(channel), available = mixer.canMute(channel);
  // Keep the space so rows don't shift once the state arrives. While faders are
  // locked the key stays visible but dimmed and does nothing.
  if (!mixer.muteKnown(channel)) return <View style={{ width, height }} />;
  const toggle = () => {
    if (!mixer.setMuted(channel, !muted)) return;
    if (session.state.settings.haptics) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };
  // Grow the touch area to at least 44pt without changing the key's size.
  const slopX = Math.max(0, (44 - width) / 2), slopY = Math.max(0, (44 - height) / 2);
  return <Pressable accessibilityRole="switch" accessibilityLabel={'Mute ' + label} accessibilityState={{ checked: muted, disabled: !available }}
    disabled={!available} onPress={toggle} hitSlop={{ left: slopX, right: slopX, top: slopY, bottom: slopY }}
    style={({ pressed }) => ({ width, height, borderRadius: 5, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: muted ? MUTE_RED : theme.dark ? '#4A5761' : '#8A8270',
      backgroundColor: muted ? MUTE_RED : theme.dark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)',
      boxShadow: muted ? [{ offsetX: 0, offsetY: 0, blurRadius: 8, color: 'rgba(255,69,58,0.55)' }] : undefined,
      opacity: !available ? 0.5 : pressed ? 0.7 : 1 })}>
    <Text style={{ color: muted ? '#FFFFFF' : theme.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 }}>MUTE</Text>
  </Pressable>;
});
