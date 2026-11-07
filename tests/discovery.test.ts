import test from 'node:test';
import assert from 'node:assert/strict';
import { browseMixers, parseNearbyMixer, reachableMixer, type DiscoveryNative, type DiscoveryState } from '../src/discovery/browser';
const service = { id: 'studio._earsmixer._tcp.local.', name: 'EarsMixer - Studio (8082)', port: 8082, addresses: ['192.168.8.108'] };

test('uses the resolved LAN address and actual port; rejects malformed advertisements', () => {
  assert.deepEqual(parseNearbyMixer(service)?.urls, ['http://192.168.8.108:8082/']);
  assert.deepEqual(parseNearbyMixer({ ...service, port: 80 })?.urls, ['http://192.168.8.108/']);
  assert.equal(parseNearbyMixer({ ...service, port: 0 }), null);
  assert.equal(parseNearbyMixer({ ...service, port: 65536 }), null);
  assert.equal(parseNearbyMixer({ ...service, addresses: ['127.0.0.1', '224.0.0.251', '169.254.1.1', '999.1.1.1', 'user:password@host'] }), null);
  assert.deepEqual(parseNearbyMixer({ ...service, addresses: ['172.20.1.3', '172.20.1.3'] })?.urls, ['http://172.20.1.3:8082/']);
});

test('browsing updates, deduplicates and removes mixers; ignores late callbacks after closing', async () => {
  const handlers: Record<string, (event: any) => void> = {};
  const states: DiscoveryState[] = [];
  let starts = 0, stops = 0, removed = 0;
  const native: DiscoveryNative = {
    start: async () => { starts++; }, stop: async () => { stops++; },
    addListener: (name, listener) => { handlers[name] = listener; return { remove: () => { removed++; } }; },
  };
  const stop = browseMixers(native, state => states.push(state));
  handlers.onFound(service); handlers.onFound({ ...service, port: 9090 });
  assert.equal(states.at(-1)?.mixers.length, 1);
  assert.equal(states.at(-1)?.mixers[0].urls[0], 'http://192.168.8.108:9090/');
  handlers.onLost({ id: service.id });
  assert.equal(states.at(-1)?.mixers.length, 0);
  handlers.onError({ message: 'Allow Local Network access' });
  assert.equal(states.at(-1)?.status, 'error');
  stop();
  const count = states.length;
  handlers.onFound(service);
  assert.equal(states.length, count);
  assert.equal(starts, 1); assert.equal(stops, 1); assert.equal(removed, 3);
});

test('Expo Go/web fall back to manual connection without requiring a native module', () => {
  let state: DiscoveryState | undefined;
  browseMixers(null, value => { state = value; })();
  assert.equal(state?.status, 'unavailable');
});

test('unreachable first interface does not hide a working server; aborts remaining probes', async () => {
  const mixer = parseNearbyMixer({ ...service, addresses: ['172.20.1.3', '192.168.8.108'] })!;
  const signals: AbortSignal[] = [];
  const url = await reachableMixer(mixer, new AbortController().signal, async (url, options) => {
    signals.push(options!.signal!);
    if (url.includes('172.20')) throw Error('Not reachable');
    return url;
  });
  assert.equal(url, 'http://192.168.8.108:8082/');
  assert(signals.every(signal => signal.aborted));
});

test('cancelled selection does not attempt a connection; wrong servers fail verification', async () => {
  const controller = new AbortController(); controller.abort();
  const mixer = parseNearbyMixer(service)!;
  await assert.rejects(reachableMixer(mixer, controller.signal, async () => { throw Error('must not probe'); }), /cancelled/);
  await assert.rejects(reachableMixer(mixer, new AbortController().signal, async () => { throw Error('not EarsMixer'); }), /no longer reachable/);
});
