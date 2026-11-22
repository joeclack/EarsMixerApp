// Warnings for arriving on a mix that someone else is using, in plain words for
// musicians who aren't sound people.

/** Someone else is on the mix now, or someone else changed it recently. */
export type MixInUse =
  | { aux: number; kind: 'peers'; names: (string | null)[] }
  | { aux: number; kind: 'recent'; name: string | null; minutesAgo: number };

// Only changes this recent count; a mix changed last week isn't in use now.
export const RECENT_CHANGE_MINUTES = 120;

function people(names: (string | null)[]) {
  const named = [...new Set(names.filter((name): name is string => !!name))];
  const unnamed = names.length - names.filter(Boolean).length;
  if (!named.length) return names.length > 1 ? 'Other people' : 'Someone';
  const shown = named.slice(0, 2);
  const others = named.length - shown.length + unnamed;
  if (!others) return shown.length === 1 ? shown[0] : shown[0] + ' and ' + shown[1];
  return shown.join(', ') + ' and ' + (others === 1 ? '1 other' : others + ' others');
}

function ago(minutes: number) {
  if (minutes < 1) return 'just now';
  if (minutes < 60) return minutes === 1 ? '1 minute ago' : minutes + ' minutes ago';
  return 'over an hour ago';
}

export function mixInUseText(warning: MixInUse, mixName: string): { title: string; message: string } {
  if (warning.kind === 'peers') {
    const who = people(warning.names);
    const verb = warning.names.length > 1 ? 'are' : 'is';
    return { title: 'Someone else is using this mix',
      message: `${who} ${verb} also on ${mixName} right now. Any changes you make, they'll hear too.` };
  }
  return { title: 'Someone else may be using this mix',
    message: `${warning.name || 'Someone else'} changed ${mixName} ${ago(warning.minutesAgo)}. Any changes you make, they'll hear too.` };
}
