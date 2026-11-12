export type SavedMixer = { url: string; lastConnected: number };

// A scanned mixer code may carry the connection PIN after the address, as
// http://192.168.1.100:8082/#pin=123456. Typed addresses never do.
export function readMixerCode(input: string): { address: string; pin: string | null } {
  const match = /^(.*?)#pin=(\d{6})$/.exec(input.trim());
  return { address: normalizeMixerAddress(match ? match[1] : input), pin: match ? match[2] : null };
}
export function normalizeMixerAddress(input: string): string {
  const value = input.trim();
  if (!value || /\s/.test(value)) throw new Error('Enter your mixer’s IP address or hostname.');
  const address = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `http://${value}`;
  let url: URL;
  try { url = new URL(address); } catch { throw new Error('Enter a valid mixer address, such as 192.168.1.100:8082.'); }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
    throw new Error('Use an HTTP or HTTPS mixer address without a username or password.');
  }
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Enter the mixer’s main address, without a page path, query or fragment.');
  }
  return url.origin + '/';
}

export function readSavedMixers(raw: string | null): SavedMixer[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed.flatMap(item => {
      if (!item || typeof item.url !== 'string' || !Number.isFinite(item.lastConnected)) return [];
      try {
        const url = normalizeMixerAddress(item.url);
        if (seen.has(url)) return [];
        seen.add(url);
        return [{ url, lastConnected: item.lastConnected }];
      } catch { return []; }
    }).sort((a, b) => b.lastConnected - a.lastConnected).slice(0, 5);
  } catch { return []; }
}

export function rememberMixer(previous: SavedMixer[], url: string, now = Date.now()): SavedMixer[] {
  const normalized = normalizeMixerAddress(url);
  return [{ url: normalized, lastConnected: now }, ...previous.filter(mixer => mixer.url !== normalized)].slice(0, 5);
}

type ProbeOptions = { fetchImpl?: typeof fetch; timeoutMs?: number; signal?: AbortSignal };

export async function probeMixer(input: string, { fetchImpl = fetch, timeoutMs = 7000, signal }: ProbeOptions = {}): Promise<string> {
  const url = normalizeMixerAddress(input);
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, timeoutMs);
  try {
    const response = await fetchImpl(url + 'api/connection', { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('The mixer returned an error. Check that EarsMixer is running.');
    let data: { url?: unknown; qr?: unknown };
    try { data = await response.json(); } catch { throw new Error('That address did not return an EarsMixer connection.'); }
    if (!data || typeof data.url !== 'string' || typeof data.qr !== 'string' || !data.qr.startsWith('data:image/')) {
      throw new Error('That address does not appear to be an EarsMixer server.');
    }
    // Keep the reachable address supplied by the musician; advertised DNS may differ.
    return url;
  } catch (error) {
    if (signal?.aborted) throw new Error('Connection cancelled.');
    if (controller.signal.aborted) throw new Error('The mixer did not respond. Check the address and that you are on the same Wi-Fi network.');
    if (error instanceof TypeError) throw new Error('Could not reach the mixer. Join its Wi-Fi network and check the address.');
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
