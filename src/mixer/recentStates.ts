export type SavedLevelState = {
  server: string; aux: number; name: string; editedAt: number;
  levels: Record<number, number>; labels: Record<number, string>;
};
export const stateKey = (server: string, aux: number) => server + '#' + aux;
export function readLevelStates(raw: string | null): Record<string, SavedLevelState> {
  const result: Record<string, SavedLevelState> = {};
  try {
    for (const value of Object.values(JSON.parse(raw || '{}')).slice(0, 512) as any[]) {
      if (!value || typeof value.server !== 'string' || !Number.isSafeInteger(value.aux) || value.aux <= 0 ||
        typeof value.name !== 'string' || !Number.isFinite(value.editedAt) || !value.levels || typeof value.levels !== 'object') continue;
      try { const url = new URL(value.server); if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) continue; } catch { continue; }
      const levels: Record<number, number> = {}, labels: Record<number, string> = {};
      for (const [id, level] of Object.entries(value.levels).slice(0, 1000)) {
        if (!/^[1-9]\d*$/.test(id) || typeof level !== 'number' || !Number.isFinite(level) || level < -150 || level > 10) continue;
        levels[Number(id)] = level;
        if (typeof value.labels?.[id] === 'string') labels[Number(id)] = value.labels[id].slice(0, 100);
      }
      if (Object.keys(levels).length) result[stateKey(value.server, value.aux)] = { server: value.server, aux: value.aux, name: value.name.slice(0, 80), editedAt: value.editedAt, levels, labels };
    }
  } catch {}
  return result;
}
