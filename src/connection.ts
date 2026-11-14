// name is the server name the admin set, as the mixer reported it on the last connection.
export type SavedMixer = { url: string; lastConnected: number; name?: string };
export type MixerInfo = { url: string; name: string };

export function readMixerName(value: unknown): string {
  return typeof value === 'string' && value.trim() && value.length <= 128 ? value.trim() : '';
}

// What to call a server: its reported name, or its address when it has none.
export function mixerLabel(url: string, recent: SavedMixer[] = []): string {
  return recent.find(mixer => mixer.url === url)?.name || new URL(url).host;
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
        const name = readMixerName(item.name);
        return [name ? { url, lastConnected: item.lastConnected, name } : { url, lastConnected: item.lastConnected }];
      } catch { return []; }
    }).sort((a, b) => b.lastConnected - a.lastConnected).slice(0, 5);
  } catch { return []; }
}

// Without a reported name (an older server), keep the name saved before.
export function rememberMixer(previous: SavedMixer[], url: string, now = Date.now(), name = ''): SavedMixer[] {
  const normalized = normalizeMixerAddress(url);
  const label = readMixerName(name) || previous.find(mixer => mixer.url === normalized)?.name;
  return [label ? { url: normalized, lastConnected: now, name: label } : { url: normalized, lastConnected: now },
    ...previous.filter(mixer => mixer.url !== normalized)].slice(0, 5);
}

type ProbeOptions = { fetchImpl?: typeof fetch; timeoutMs?: number; signal?: AbortSignal };

export async function probeMixer(input: string, options: ProbeOptions = {}): Promise<string> {
  return (await probeMixerInfo(input, options)).url;
}

// Also returns the server's name; '' from servers that do not report one.
export async function probeMixerInfo(input: string, { fetchImpl = fetch, timeoutMs = 7000, signal }: ProbeOptions = {}): Promise<MixerInfo> {
  const url = normalizeMixerAddress(input);
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, timeoutMs);
  try {
    const response = await fetchImpl(url + 'api/connection', { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('The mixer returned an error. Check that EarsMixer is running.');
    let data: { url?: unknown; qr?: unknown; name?: unknown };
    try { data = await response.json(); } catch { throw new Error('That address did not return an EarsMixer connection.'); }
    if (!data || typeof data.url !== 'string' || typeof data.qr !== 'string' || !data.qr.startsWith('data:image/')) {
      throw new Error('That address does not appear to be an EarsMixer server.');
    }
    // Keep the reachable address supplied by the musician; advertised DNS may differ.
    return { url, name: readMixerName(data.name) };
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
