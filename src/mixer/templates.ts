import { readPreferences, type Preferences } from './model';
export type MixerTemplate = { id: string; name: string };
export async function requestTemplates(server: string, id?: string, fetcher: typeof fetch = fetch, signal?: AbortSignal): Promise<any> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 10000);
  try {
    const response = await fetcher(server + 'api/templates' + (id ? '/' + encodeURIComponent(id) : ''), { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error(id ? 'Could not load this template.' : 'Could not load templates.');
    const data = await response.json();
    if (id) return data;
    if (!Array.isArray(data.templates)) throw new Error('Invalid template list.');
    return data.templates.filter((value: any) => typeof value?.id === 'string' && /^[a-f0-9]{64}$/.test(value.id) && typeof value.name === 'string' && value.name.length <= 80)
      .map(({ id, name }: MixerTemplate) => ({ id, name }));
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
}
export function templatePreferences(config: unknown, compact: boolean): Preferences {
  const preferences = config && typeof config === 'object' ? readPreferences({ ...config, compact }) : null;
  if (!preferences) throw new Error('This template has an invalid layout.');
  return preferences;
}
