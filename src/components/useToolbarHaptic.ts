import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSession } from '../mixer/context';

export function useToolbarHaptic() {
  const { session } = useSession();
  return useCallback(() => {
    if (Platform.OS !== 'web' && session.state.settings.haptics)
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [session]);
}
