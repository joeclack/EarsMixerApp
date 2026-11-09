import type { Channel, ChannelGroup, Preferences, MixerConfig } from './model';
import { orderedChannels, hiddenChannels, groupsForAux } from './model';

export type GroupBalance = { offsets: Record<number, number | null>; expected: Record<number, number> };
export const groupKey = (aux: number, members: number[]) => aux + ':' + [...members].sort((a, b) => a - b).join(',');
export const groupChannelNames = (group: ChannelGroup, channels: Channel[]) => group.members.map(id => channels.find(c => c.channel === id)?.label || 'Channel ' + id).join(' / ');
export const groupLabel = (group: ChannelGroup, channels: Channel[]) => group.name || groupChannelNames(group, channels);
export function moveGroupMembers(members: number[], indices: number[], destination: number): number[] {
  const selected = new Set(indices.filter(index => Number.isInteger(index) && index >= 0 && index < members.length));
  if (!Number.isInteger(destination) || destination < 0 || destination > members.length || !selected.size) return members;
  const moving = members.filter((_id, index) => selected.has(index));
  const remaining = members.filter((_id, index) => !selected.has(index));
  remaining.splice(destination - [...selected].filter(index => index < destination).length, 0, ...moving);
  return remaining;
}
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
  const groups = groupsForAux(preferences, aux).filter(group => group.members.every(id => channels.some(c => c.channel === id)));
  const emitted = new Set<number>();
  return channels.flatMap(channel => {
    const group = groups.find(group => group.members.includes(channel.channel));
    if (!group) return [channel];
    const members = group.members, id = -group.id;
    if (emitted.has(id)) return [];
    emitted.add(id);
    const label = groupLabel(group, channels);
    const header: MixerRow = { ...channel, channel: id, label, members, group: id };
    return expanded.includes(id) || pan ? [header, ...members.map(member => ({ ...channels.find(c => c.channel === member)!, group: id }))] : [header];
  });
}
