export type Channel = { channel: number; label: string; order: number };
export type Aux = { channel: number; label: string; colour: string; stereo: boolean };
export type MixerConfig = { channels: Channel[]; aux: Aux[]; snapshot: string };
export type Parameter = 'level' | 'pan';
export type ChannelGroup = { id: number; name: string; members: number[] };
export type GroupScope = { server: string; aux: number };
export type Preferences = {
  selectedAux: number | null; channelOrder: number[];
  favouritesByAux: Record<string, { channels: number[]; enabled: boolean }>;
  hiddenByAux: Record<string, number[]>;
  groupsByAux: Record<string, ChannelGroup[]>;
  globalGroups: ChannelGroup[];
  view: 'list' | 'grid'; compact: boolean;
};
export type User = { id: string; username: string; displayName: string };
export type Account = { user: User | null; preferences: Preferences | null; revision: number };
export const emptyPreferences = (): Preferences => ({ selectedAux: null, channelOrder: [], favouritesByAux: {}, hiddenByAux: {}, groupsByAux: {}, globalGroups: [], view: 'list', compact: true });
const record = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const positive = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) > 0;
function readGroups(entries: unknown): ChannelGroup[] | null {
  if (!Array.isArray(entries) || entries.length > 500) return null;
  const seen = new Set<number>(), ids = new Set<number>();
  const result: ChannelGroup[] = [];
  for (const entry of entries) {
    // Preserve the virtual ID of legacy groups when upgrading their arrays.
    const group = Array.isArray(entry) ? { id: entry[0], name: '', members: entry } : entry;
    if (!record(group) || !positive(group.id) || ids.has(group.id) || typeof group.name !== 'string' || group.name.length > 80 ||
      !Array.isArray(group.members) || group.members.length < 2 || group.members.length > 1000 || !group.members.every(positive)) return null;
    ids.add(group.id);
    for (const id of group.members) { if (seen.has(id)) return null; seen.add(id); }
    if (seen.size > 1000) return null;
    result.push({ id: group.id, name: group.name.trim(), members: [...group.members] });
  }
  return result;
}
export function groupsForAux(preferences: Preferences, aux: number | null): ChannelGroup[] {
  return [...preferences.globalGroups, ...(preferences.groupsByAux[String(aux)] || [])];
}
export function readPreferences(v: unknown): Preferences | null {
  if (!record(v) || !(v.selectedAux === null || positive(v.selectedAux)) ||
      !Array.isArray(v.channelOrder) || v.channelOrder.length > 1000 || !v.channelOrder.every(positive) ||
      !record(v.favouritesByAux) || Object.keys(v.favouritesByAux).length > 256 ||
      !['list', 'grid'].includes(v.view) || typeof v.compact !== 'boolean') return null;
  const hiddenByAux: Preferences['hiddenByAux'] = {};
  if (v.hiddenByAux !== undefined) {
    if (!record(v.hiddenByAux) || Object.keys(v.hiddenByAux).length > 256) return null;
    for (const [id, ids] of Object.entries(v.hiddenByAux)) {
      if (!/^[1-9]\d*$/.test(id) || !Array.isArray(ids) || ids.length > 1000 || !ids.every(positive)) return null;
      hiddenByAux[id] = [...new Set(ids)];
    }
  }
  const favouritesByAux: Preferences['favouritesByAux'] = {};
  for (const [id, entry] of Object.entries(v.favouritesByAux)) {
    if (!/^[1-9]\d*$/.test(id) || !positive(Number(id)) || !record(entry) || typeof entry.enabled !== 'boolean' ||
      !Array.isArray(entry.channels) || entry.channels.length > 1000 || !entry.channels.every(positive)) return null;
    favouritesByAux[id] = { channels: [...new Set(entry.channels)], enabled: entry.enabled };
  }
  const groupsByAux: Preferences['groupsByAux'] = {};
  const globalGroups = readGroups(v.globalGroups ?? []);
  if (!globalGroups) return null;
  if (v.groupsByAux !== undefined) {
    if (!record(v.groupsByAux) || Object.keys(v.groupsByAux).length > 256) return null;
    for (const [aux, groups] of Object.entries(v.groupsByAux)) {
      if (!/^[1-9]\d*$/.test(aux) || !positive(Number(aux))) return null;
      const migrated = readGroups(groups);
      if (!migrated || !readGroups([...globalGroups, ...migrated])) return null;
      groupsByAux[aux] = migrated;
    }
  }
  return { selectedAux: v.selectedAux, channelOrder: [...new Set(v.channelOrder)], favouritesByAux, hiddenByAux, groupsByAux, globalGroups, view: v.view, compact: true };
}
export function parseConfig(value: unknown): MixerConfig | null {
  if (!record(value) || !Array.isArray(value.channels) || !Array.isArray(value.aux)) return null;
  const unique = <T extends { channel: number }>(rows: T[]) => [...new Map(rows.map(row => [row.channel, row])).values()];
  return {
    channels: unique(value.channels.filter((c: any) => record(c) && positive(c.channel) && c.enabled !== false).map((c: any) =>
      ({ channel: c.channel, label: typeof c.label === 'string' ? c.label : 'Channel ' + c.channel, order: Number.isFinite(c.order) ? c.order : c.channel }))).sort((a, b) => a.order - b.order),
    aux: unique(value.aux.filter((a: any) => record(a) && positive(a.channel) && a.enabled !== false).map((a: any) =>
      ({ channel: a.channel, label: typeof a.label === 'string' ? a.label : 'Mix ' + a.channel, colour: /^#[a-f\d]{6}$/i.test(a.colour) ? a.colour : '#007AFF', stereo: !!a.stereo }))),
    snapshot: typeof value.snapshot === 'string' ? value.snapshot : '',
  };
}
export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const dbToPosition = (db: number) => db <= -150 ? 0 : clamp(Math.pow(100, (db + 90) / 100) / 100);
export const positionToDb = (position: number) => position <= 0 ? -150 : Math.max(-150, Math.min(10, Math.log10(clamp(position) * 100) * 50 - 90));
export function levelText(value: number | undefined, parameter: Parameter): string {
  if (value === undefined) return '—';
  if (parameter === 'level') return value <= -150 ? '−∞ dB' : Number(value.toFixed(1)) + ' dB';
  const offset = Math.round(Math.abs(value * 2 - 1) * 100);
  return offset === 0 ? 'Centre' : (value < 0.5 ? 'L ' : 'R ') + offset;
}
export function orderedChannels(config: MixerConfig | null, preferences: Preferences): Channel[] {
  const channels = config?.channels || [];
  const order = new Map(preferences.channelOrder.map((id, index) => [id, index]));
  return [...channels].sort((a, b) => (order.get(a.channel) ?? 10000 + a.order) - (order.get(b.channel) ?? 10000 + b.order));
}

export function hiddenChannels(config: MixerConfig | null, preferences: Preferences, aux: number | null): number[] {
  if (aux === null) return [];
  if (preferences.hiddenByAux[String(aux)]) return preferences.hiddenByAux[String(aux)];
  // Older device layouts and server templates described visible channels using
  // an enabled favourites filter. Preserve that visibility when upgrading.
  const legacy = preferences.favouritesByAux[String(aux)];
  return legacy?.enabled ? (config?.channels || []).filter(channel => !legacy.channels.includes(channel.channel)).map(channel => channel.channel) : [];
}
