import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedNavigation, normalizeMixerAddress, probeMixer, readSavedMixers, rememberMixer } from '../src/connection';

test('mixer addresses accept local IPs, DNS, ports, HTTPS and IPv6', () => {
  assert.equal(normalizeMixerAddress(' 192.168.1.10:8082 '), 'http://192.168.1.10:8082/');
  assert.equal(normalizeMixerAddress('ears.glow.uk'), 'http://ears.glow.uk/');
  assert.equal(normalizeMixerAddress('https://ears.example.com/'), 'https://ears.example.com/');
  assert.equal(normalizeMixerAddress('http://[fd00::1]:8082'), 'http://[fd00::1]:8082/');
});

test('rejects unsupported schemes, embedded credentials, extra paths and malformed addresses', () => {
  for (const input of ['', 'file:///etc/passwd', 'javascript:alert(1)', 'ftp://host', 'http://user:password@host', 'http://host/admin', 'http://host/?aux=1', 'http://host/#mix', 'not a host', 'http://[bad']) {
    assert.throws(() => normalizeMixerAddress(input), Error, input);
  }
});

test('only an EarsMixer response permits connection and the entered address is preserved', async () => {
  const fetchImpl: typeof fetch = async (input) => {
    assert.equal(input, 'http://192.168.1.10:8082/api/connection');
    return Response.json({ url: 'http://unreachable-advertised-name/', qr: 'data:image/png;base64,test' });
  };
  assert.equal(await probeMixer('192.168.1.10:8082', { fetchImpl }), 'http://192.168.1.10:8082/');
  await assert.rejects(probeMixer('host', { fetchImpl: async () => Response.json({ hello: 'world' }) }), /EarsMixer server/);
  await assert.rejects(probeMixer('host', { fetchImpl: async () => new Response('<html>Not a mixer</html>') }), /EarsMixer connection/);
  await assert.rejects(probeMixer('host', { fetchImpl: async () => new Response('error', { status: 500 }) }), /returned an error/);
  await assert.rejects(probeMixer('host', { fetchImpl: async () => { throw new TypeError('Network failed'); } }), /same Wi-Fi|Wi-Fi network/);
});

test('connection timeouts and cancellation stop pending requests', async () => {
  const hangingFetch: typeof fetch = async (_input, init) => new Promise((_resolve, reject) => {
    if (init?.signal?.aborted) reject(new Error('aborted'));
    init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  });
  await assert.rejects(probeMixer('host', { fetchImpl: hangingFetch, timeoutMs: 5 }), /did not respond/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(probeMixer('host', { fetchImpl: hangingFetch, signal: controller.signal }), /cancelled/);
});

test('recent mixers are capped, deduplicated and survive corrupted storage', () => {
  const items = Array.from({ length: 7 }, (_, index) => ({ url: `http://mixer${index}.local/`, lastConnected: index }));
  const next = rememberMixer(items, 'mixer2.local', 100);
  assert.equal(next.length, 5);
  assert.equal(next[0].url, 'http://mixer2.local/');
  assert.equal(next.filter(item => item.url === next[0].url).length, 1);
  assert.deepEqual(readSavedMixers('{corrupt'), []);
  assert.deepEqual(readSavedMixers(JSON.stringify([{ url: 'file:///bad', lastConnected: 1 }])), []);
  assert.equal(readSavedMixers(JSON.stringify(items)).length, 5);
  assert.equal(readSavedMixers(JSON.stringify(items))[0].url, 'http://mixer6.local/');
});

test('embedded mixer cannot navigate into other servers or native URL schemes', () => {
  const mixer = 'http://192.168.1.10:8082/';
  assert(isAllowedNavigation(mixer + 'admin', mixer));
  assert(isAllowedNavigation('about:blank', mixer));
  for (const target of ['http://evil.example/', 'https://192.168.1.10:8082/', 'file:///private', 'javascript:alert(1)', 'intent://native-app']) {
    assert.equal(isAllowedNavigation(target, mixer), false, target);
  }
});
