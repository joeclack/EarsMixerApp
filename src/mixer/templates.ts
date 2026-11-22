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
// A template is one channel layout for any mix: its hidden channels apply to
// every mix on the mixer and its groups are all-mix groups. Templates from
// servers before 1.21.0 have no `hidden` list and keep their per-mix layout.
export function templatePreferences(config: unknown, compact: boolean, auxes: number[] = []): Preferences {
  const preferences = config && typeof config === 'object' ? readPreferences({ ...config, compact }) : null;
  if (!preferences) throw new Error('This template has an invalid layout.');
  const hidden = (config as { hidden?: unknown }).hidden;
  if (hidden === undefined) return preferences;
  if (!Array.isArray(hidden) || hidden.length > 1000 || !hidden.every(id => Number.isInteger(id) && id > 0)) throw new Error('This template has an invalid layout.');
  const ids = [...new Set(hidden as number[])];
  return { ...preferences, hiddenByAux: Object.fromEntries(auxes.map(aux => [String(aux), [...ids]])), groupsByAux: {} };
}
