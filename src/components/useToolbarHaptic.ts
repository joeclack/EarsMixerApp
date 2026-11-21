import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export function useToolbarHaptic() {
  return useCallback(() => {
    if (Platform.OS !== 'web')
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);
}
