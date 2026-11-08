import { probeMixer } from '../connection';

export type NearbyMixer = { id: string; name: string; urls: string[] };
export type DiscoveryState = { status: 'searching' | 'ready' | 'unavailable' | 'error'; mixers: NearbyMixer[]; message: string };
type Found = { id: string; name: string; addresses: string[]; port: number };
type Events = { onFound: Found; onLost: { id: string }; onError: { message: string } };
export interface DiscoveryNative {
  start(): Promise<void>;
  stop(): Promise<void>;
  addListener<K extends keyof Events>(event: K, listener: (value: Events[K]) => void): { remove(): void };
}

export function parseNearbyMixer(value: unknown): NearbyMixer | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Partial<Found>;
  if (typeof data.id !== 'string' || !data.id || data.id.length > 512 ||
      typeof data.name !== 'string' || !data.name.trim() || data.name.length > 128 ||
      !Number.isInteger(data.port) || data.port! < 1 || data.port! > 65535 || !Array.isArray(data.addresses)) return null;
  const addresses = data.addresses.filter((value: unknown): value is string => {
    if (typeof value !== 'string' || !/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) return false;
    const octets = value.split('.').map(Number);
    return octets.every(n => n <= 255) && octets[0] > 0 && octets[0] < 224 && octets[0] !== 127 &&
      !(octets[0] === 169 && octets[1] === 254);
  });
  const urls = [...new Set(addresses)].slice(0, 8).map(address => `http://${address}${data.port === 80 ? '' : ':' + data.port}/`);
  return urls.length ? { id: data.id, name: data.name.trim(), urls } : null;
}

// Browse only: finding a service never logs in, selects an AUX or writes levels.
export function browseMixers(native: DiscoveryNative | null, update: (state: DiscoveryState) => void) {
  if (!native) {
    update({ status: 'unavailable', mixers: [], message: '' });
    return () => {};
  }
  let active = true;
  const mixers = new Map<string, NearbyMixer>();
  const publish = (status: DiscoveryState['status'] = 'ready', message = '') => {
    if (active) update({ status, message, mixers: [...mixers.values()].sort((a, b) => a.name.localeCompare(b.name)) });
  };
  const subscriptions = [
    native.addListener('onFound', value => {
      if (!active) return;
      const mixer = parseNearbyMixer(value);
      if (mixer && (mixers.has(mixer.id) || mixers.size < 100)) { mixers.set(mixer.id, mixer); publish(); }
    }),
    native.addListener('onLost', value => { if (active) { mixers.delete(value.id); publish(); } }),
    native.addListener('onError', value => { clearTimeout(timer); publish('error', value.message || 'Could not search for nearby mixers.'); }),
  ];
  const timer = setTimeout(() => publish(), 10000);
  publish('searching');
  void native.start().catch(() => { clearTimeout(timer); publish('error', 'Could not search for nearby mixers. Try again.'); });
  return () => {
    active = false;
    clearTimeout(timer);
    subscriptions.forEach(subscription => subscription.remove());
    void native.stop().catch(() => {});
  };
}

// Resolve all advertised interfaces in parallel. A stale or unreachable address
// must not win merely because it was listed first (e.g. Ethernet and Wi-Fi).
export async function reachableMixer(mixer: NearbyMixer, signal: AbortSignal,
  probe: typeof probeMixer = probeMixer): Promise<string> {
  if (signal.aborted) throw new Error('Connection cancelled.');
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  try {
    return await Promise.any(mixer.urls.map(url => probe(url, { timeoutMs: 4000, signal: controller.signal })));
  } catch {
    throw new Error(signal.aborted ? 'Connection cancelled.' : 'This mixer is no longer reachable. Check your Wi-Fi or try its address.');
  } finally { controller.abort(); signal.removeEventListener('abort', abort); }
}
