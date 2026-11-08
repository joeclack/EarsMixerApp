import { useCallback, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { requireOptionalNativeModule } from 'expo';
import { probeMixer } from '../connection';
import { useSession } from '../mixer/context';
import { browseMixers, type DiscoveryNative, type DiscoveryState } from './browser';

const native = Platform.OS === 'web' ? null : requireOptionalNativeModule<DiscoveryNative>('EarsMixerDiscovery');
export function useNearbyMixers() {
  const { state: session } = useSession();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<DiscoveryState>({ status: 'searching', mixers: [], message: '' });
  useFocusEffect(useCallback(() => {
    let abort: AbortController | undefined;
    let stop: (() => void) | undefined;
    const change = (status: string) => {
      stop?.(); stop = undefined; abort?.abort();
      if (status !== 'active') return;
      abort = new AbortController();
      const signal = abort.signal;
      const known = new Map<string, { id: string; name: string; urls: string[] }>();
      let latest: DiscoveryState = { status: 'searching', mixers: [], message: '' };
      const publish = () => { if (!signal.aborted) setState({ ...latest, mixers: [...latest.mixers, ...[...known.values()].filter(item => !latest.mixers.some(found => found.urls.includes(item.urls[0])))] }); };
      stop = browseMixers(native, value => { latest = value; publish(); });
      for (const recent of session.recent) void probeMixer(recent.url, { signal, timeoutMs: 2500 }).then(url => {
        known.set(url, { id: url, name: new URL(url).host, urls: [url] }); publish();
      }).catch(() => {});
    };
    change(AppState.currentState || 'active');
    const listener = AppState.addEventListener('change', change);
    return () => { abort?.abort(); stop?.(); listener.remove(); };
  }, [attempt, session.recent]));
  return { ...state, retry: () => setAttempt(value => value + 1) };
}
