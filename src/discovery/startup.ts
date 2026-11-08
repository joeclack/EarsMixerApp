import { browseMixers, reachableMixer, type DiscoveryNative, type NearbyMixer } from './browser';
import { probeMixer } from '../connection';

// Wait for a discovery window rather than connecting to the first announcement:
// a second desk can arrive a moment later.
export async function findStartupMixers(native: DiscoveryNative | null, recent: string[], signal: AbortSignal, duration = 4000): Promise<NearbyMixer[]> {
  let discovered: NearbyMixer[] = [];
  const known: NearbyMixer[] = [];
  const stop = browseMixers(native, state => { discovered = state.mixers; });
  try {
    const checks = recent.map(async url => {
      try {
        const reachable = await probeMixer(url, { signal, timeoutMs: 2500 });
        known.push({ id: reachable, name: new URL(reachable).host, urls: [reachable] });
      } catch {}
    });
    await Promise.all([Promise.all(checks), new Promise<void>(resolve => {
      if (!native || signal.aborted) { resolve(); return; }
      const finish = () => { clearTimeout(timer); signal.removeEventListener('abort', finish); resolve(); };
      const timer = setTimeout(finish, duration);
      signal.addEventListener('abort', finish, { once: true });
    })]);
    return signal.aborted ? [] : discovered.length ? discovered : known;
  } finally { stop(); }
}
export { reachableMixer };
