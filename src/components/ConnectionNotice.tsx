import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, Text, View } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import HardwarePanel from './HardwarePanel';
import NativeButton from './NativeButton';
import { Icon } from './ui';

// How long the mixer must stay unreachable before the user is told. Brief
// drops that the client recovers from on its own pass silently.
const SUSTAINED_DROP_MS = 8000;

// A persistent notice over the mixer while its connection has been lost for a
// sustained time. It links to Settings, where the connection is managed, and
// confirms briefly once the mixer is reachable again.
export default function ConnectionNotice() {
  const { session, state, mix } = useSession(), theme = useTheme(), insets = useSafeAreaInsets();
  const pinNeeded = !!state.pinPrompt;
  // Waiting for a PIN is not a lost connection.
  const down = !!state.server && !state.demo && mix.status !== 'connected' && !pinNeeded;
  const [shown, setShown] = useState(false);
  const wasShown = useRef(false);
  useEffect(() => {
    if (!down) {
      // Confirm only a real recovery; a deliberate disconnect just clears the notice.
      if (wasShown.current && session.state.server && session.mixer.state.status === 'connected') session.notifySuccess('Reconnected to the mixer');
      wasShown.current = false; setShown(false);
      return;
    }
    const timer = setTimeout(() => {
      wasShown.current = true; setShown(true);
      if (session.state.settings.haptics) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility('Lost connection to the mixer. Check your Wi-Fi.');
    }, SUSTAINED_DROP_MS);
    return () => clearTimeout(timer);
  // Depends only on reachability, so retries flipping between connecting and
  // disconnected do not restart the timer.
  }, [down, session]);
  const progress = useSharedValue(0);
  const visible = shown || pinNeeded;
  useEffect(() => {
    progress.set(withTiming(visible ? 1 : 0, { duration: 200, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }));
  }, [visible, progress]);
  const animated = useAnimatedStyle(() => ({ opacity: progress.get(), transform: [{ translateY: (1 - progress.get()) * 8 }] }));
  return <View pointerEvents={visible ? 'box-none' : 'none'} style={{ position: 'absolute', left: insets.left + 16, right: insets.right + 16,
    bottom: insets.bottom + 16, alignItems: 'center', zIndex: 90 }}>
    <Animated.View accessible={visible} accessibilityLiveRegion="assertive" style={[{ maxWidth: 440, width: '100%' }, animated]}>
      <HardwarePanel radius={18} uniformBorder style={{ paddingLeft: 16, paddingRight: 8, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon name={pinNeeded ? { ios: 'lock', android: 'lock', web: 'lock' } : { ios: 'wifi.exclamationmark', android: 'wifi_off', web: 'wifi_off' }} size={22} color={theme.orange} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>{pinNeeded ? 'This mixer needs a PIN' : 'Lost connection to the mixer'}</Text>
          <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 18 }}>
            {pinNeeded ? (state.pinPrompt?.revoked ? 'This device was signed out. Enter the current PIN.' : 'Enter the connection PIN to control your mix.')
              : "Check you're on the mixer's Wi-Fi. Reconnecting…"}
          </Text>
        </View>
        {pinNeeded ? <NativeButton title="Enter PIN" compact bordered onPress={() => router.push('/pin')} />
          : <NativeButton title="Settings" compact bordered onPress={() => router.push('/settings')} />}
      </HardwarePanel>
    </Animated.View>
  </View>;
}
