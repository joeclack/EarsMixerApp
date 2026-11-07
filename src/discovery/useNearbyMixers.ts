import { useCallback, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { requireOptionalNativeModule } from 'expo';
import { browseMixers, type DiscoveryNative, type DiscoveryState } from './browser';

const native = Platform.OS === 'web' ? null : requireOptionalNativeModule<DiscoveryNative>('EarsMixerDiscovery');
export function useNearbyMixers() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<DiscoveryState>({ status: 'searching', mixers: [], message: '' });
  useFocusEffect(useCallback(() => {
    let stop: (() => void) | undefined;
    const change = (status: string) => {
      stop?.(); stop = undefined;
      if (status === 'active') stop = browseMixers(native, setState);
    };
    change(AppState.currentState || 'active');
    const listener = AppState.addEventListener('change', change);
    return () => { stop?.(); listener.remove(); };
  }, [attempt]));
  return { ...state, retry: () => setAttempt(value => value + 1) };
}
