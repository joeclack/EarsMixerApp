import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Platform, Text, View } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useConfirmationState } from '../mixer/context';
import { useTheme } from '../theme';
import HardwarePanel from './HardwarePanel';
import { Icon } from './ui';

export default function ConfirmationToast() {
  const { session, confirmation } = useConfirmationState();
  return confirmation ? <Notice key={confirmation.id} message={confirmation.message}
    haptics={session.state.settings.haptics} onDismiss={() => session.dismissConfirmation(confirmation.id)} /> : null;
}

function Notice({ message, haptics, onDismiss }: { message: string; haptics: boolean; onDismiss(): void }) {
  const theme = useTheme(), insets = useSafeAreaInsets();
  const progress = useSharedValue(0), announced = useRef(false);
  const dismiss = useRef(onDismiss); dismiss.current = onDismiss;
  useEffect(() => {
    progress.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System });
    if (!announced.current) {
      announced.current = true;
      if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(message);
      if (haptics) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    let alive = true;
    let hide: ReturnType<typeof setTimeout> | undefined;
    let remove: ReturnType<typeof setTimeout> | undefined;
    void AccessibilityInfo.isScreenReaderEnabled().catch(() => false).then(enabled => {
      if (!alive) return;
      hide = setTimeout(() => {
        progress.value = withTiming(0, { duration: 160, reduceMotion: ReduceMotion.System });
        remove = setTimeout(() => dismiss.current(), 180);
      }, enabled ? 6000 : 2600);
    });
    return () => { alive = false; clearTimeout(hide); clearTimeout(remove); };
  }, [message, haptics, progress]);
  const animated = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ translateY: (1 - progress.value) * 6 }] }));
  return <View pointerEvents="none" style={{ position: 'absolute', left: insets.left + 20, right: insets.right + 20,
    bottom: insets.bottom + 20, alignItems: 'center', zIndex: 100 }}>
    <Animated.View testID="action-confirmation" accessible accessibilityLiveRegion="polite" accessibilityLabel={message}
      style={[{ maxWidth: 420, width: '100%' }, animated]}>
      <HardwarePanel radius={18} style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon name={{ ios: 'checkmark.circle', android: 'check_circle_outline', web: 'check_circle_outline' }} size={20} />
        <Text numberOfLines={3} style={{ color: theme.text, fontSize: 14, lineHeight: 20, flex: 1 }}>{message}</Text>
      </HardwarePanel>
    </Animated.View>
  </View>;
}
