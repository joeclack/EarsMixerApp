import { groupsForAux, orderedChannels, type ChannelGroup, type MixerConfig, type Preferences } from './model';
import { groupLabel } from './groups';

export type LayoutItem = { key: number; label: string; members: number[]; group?: ChannelGroup };

// Retain unavailable saved channels, so editing a layout never forgets them.
export function layoutChannelOrder(config: MixerConfig | null, preferences: Preferences, aux: number | null): number[] {
  return [...new Set([...preferences.channelOrder, ...orderedChannels(config, preferences).map(channel => channel.channel),
    ...groupsForAux(preferences, aux).flatMap(group => group.members)])];
}

export function contiguousGroupOrder(config: MixerConfig | null, preferences: Preferences, aux: number | null): number[] {
  const groups = groupsForAux(preferences, aux), emitted = new Set<number>();
  return layoutChannelOrder(config, preferences, aux).flatMap(id => {
    const group = groups.find(entry => entry.members.includes(id));
    if (!group) return [id];
    if (emitted.has(group.id)) return [];
    emitted.add(group.id);
    return group.members;
  });
}

export function layoutItems(config: MixerConfig | null, preferences: Preferences, aux: number | null): LayoutItem[] {
  const channels = config?.channels || [], groups = groupsForAux(preferences, aux), emitted = new Set<number>();
  return layoutChannelOrder(config, preferences, aux).flatMap<LayoutItem>(id => {
    const group = groups.find(entry => entry.members.includes(id));
    if (group) {
      if (emitted.has(group.id)) return [];
      emitted.add(group.id);
      return [{ key: -group.id, label: groupLabel(group, channels), members: [...group.members], group }];
    }
    const channel = channels.find(entry => entry.channel === id);
    return channel ? [{ key: id, label: channel.label, members: [id] }] : [];
  });
}

// Keep an existing group's place when adding/removing/reordering members.
// Released channels follow the group; newly added channels join at its end.
export function replaceLayoutGroup(order: number[], previous: number[], members: number[]): number[] {
  const anchorMembers = previous.length ? previous : members;
  const anchor = order.findIndex(id => anchorMembers.includes(id));
  const involved = new Set([...previous, ...members]);
  const rest = order.filter(id => !involved.has(id));
  const destination = anchor < 0 ? rest.length : order.slice(0, anchor).filter(id => !involved.has(id)).length;
  rest.splice(destination, 0, ...members, ...previous.filter(id => !members.includes(id)));
  return rest;
}
