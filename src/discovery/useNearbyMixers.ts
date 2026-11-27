import { useCallback, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { requireOptionalNativeModule } from 'expo';
import { probeMixerInfo } from '../connection';
import { useSession } from '../mixer/context';
import { browseMixers, type DiscoveryNative, type DiscoveryState } from './browser';

// After this long with nothing found, the sheet suggests checking the Wi-Fi.
const SLOW_SEARCH_MS = 10000;
// Saved mixers are checked again this often, so one that comes online appears.
const RECHECK_SAVED_MS = 5000;
const native = Platform.OS === 'web' ? null : requireOptionalNativeModule<DiscoveryNative>('EarsMixerDiscovery');

// Nearby mixers for the connect sheet. The search runs for as long as the
// sheet is open: network discovery keeps listening and saved mixers are
// checked again every few seconds, so mixers appear without a tap. Only a
// failed search stops it, and retry starts it again.
export function useNearbyMixers() {
  const { state: session } = useSession();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<DiscoveryState & { slow: boolean }>({ status: 'searching', mixers: [], message: '', slow: false });
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
      let slow = false;
      const publish = () => {
        if (signal.aborted) return;
        const mixers = [...latest.mixers, ...[...known.values()].filter(item => !latest.mixers.some(found => found.urls.includes(item.urls[0])))];
        setState({ ...latest, status: latest.status === 'error' ? 'error' : 'searching', mixers, slow });
      };
      stop = browseMixers(native, value => { latest = value; publish(); });
      let checking = false;
      const checkSaved = () => {
        if (checking || signal.aborted || !session.recent.length) return;
        checking = true;
        void Promise.all(session.recent.map(recent => probeMixerInfo(recent.url, { signal, timeoutMs: 2500 }).then(({ url, name }) => {
          known.set(recent.url, { id: url, name: name || recent.name || new URL(url).host, urls: [url] });
        }).catch(() => { known.delete(recent.url); }))).finally(() => { checking = false; publish(); });
      };
      checkSaved();
      const timers = [setInterval(checkSaved, RECHECK_SAVED_MS), setTimeout(() => { slow = true; publish(); }, SLOW_SEARCH_MS)];
      signal.addEventListener('abort', () => timers.forEach(clearTimeout), { once: true });
    };
    change(AppState.currentState || 'active');
    const listener = AppState.addEventListener('change', change);
    return () => { abort?.abort(); stop?.(); listener.remove(); };
  }, [attempt, session.recent]));
  return { ...state, retry: () => setAttempt(value => value + 1) };
}
