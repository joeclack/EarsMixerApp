import type { Channel, Preferences, MixerConfig } from './model';
import { orderedChannels, hiddenChannels } from './model';

export type GroupBalance = { offsets: Record<number, number | null>; expected: Record<number, number> };
export const groupKey = (aux: number, members: number[]) => aux + ':' + [...members].sort((a, b) => a - b).join(',');
export function captureBalance(members: number[], values: Record<number, number>): GroupBalance {
  const top = Math.max(...members.map(id => values[id]));
  return { offsets: Object.fromEntries(members.map(id => [id, values[id] <= -150 ? null : values[id] - top])),
    expected: Object.fromEntries(members.map(id => [id, values[id]])) };
}
export function groupLevels(balance: GroupBalance, level: number): Record<number, number> {
  return Object.fromEntries(Object.entries(balance.offsets).map(([id, offset]) =>
    [id, offset === null || level <= -150 ? -150 : Math.max(-150, Math.min(10, level + offset))]));
}
export type MixerRow = Channel & { members?: number[]; group?: number };
export type MixerSection = { header: MixerRow; channels: MixerRow[] };
// Keep a group's members inside one list item so its frame remains continuous
// during scrolling and orientation changes, including individual pan controls.
export function mixerSections(rows: MixerRow[]): MixerSection[] {
  const sections: MixerSection[] = [];
  for (const row of rows) {
    const parent = sections.at(-1);
    if (row.group && !row.members && parent?.header.channel === row.group) parent.channels.push(row);
    else sections.push({ header: row, channels: [] });
  }
  return sections;
}
export function mixerRows(config: MixerConfig | null, preferences: Preferences, aux: number | null, expanded: number[], pan = false): MixerRow[] {
  const hidden = hiddenChannels(config, preferences, aux);
  const channels = orderedChannels(config, preferences).filter(c => !hidden.includes(c.channel));
  // Hidden or unavailable members are never moved by a collapsed group.
  const groups = (preferences.groupsByAux[String(aux)] || []).filter(group => group.every(id => channels.some(c => c.channel === id)));
  const emitted = new Set<number>();
  return channels.flatMap(channel => {
    const members = groups.find(group => group.includes(channel.channel));
    if (!members) return [channel];
    const id = -members[0];
    if (emitted.has(id)) return [];
    emitted.add(id);
    const label = members.map(member => channels.find(c => c.channel === member)!.label).join(' / ');
    const header: MixerRow = { ...channel, channel: id, label, members, group: id };
    return expanded.includes(id) || pan ? [header, ...members.map(member => ({ ...channels.find(c => c.channel === member)!, group: id }))] : [header];
  });
}
