// Channel colours from the server are shown softened, not as the exact hex.

// Blends a six-digit hex colour toward black (amount < 0) or white (amount > 0).
export function shade(hex: string, amount: number) {
  const target = amount < 0 ? 0 : 255;
  return '#' + [1, 3, 5].map(i => {
    const value = parseInt(hex.slice(i, i + 2), 16);
    return Math.round(value + (target - value) * Math.abs(amount)).toString(16).padStart(2, '0');
  }).join('');
}

// Pulls a colour part of the way toward its own grey, taking the edge off
// fully saturated picks such as pure red.
export function mute(hex: string, amount: number) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const grey = 0.299 * r + 0.587 * g + 0.114 * b;
  return '#' + [r, g, b].map(value => Math.round(value + (grey - value) * amount).toString(16).padStart(2, '0')).join('');
}

// The marker gradient: a lighter, slightly muted top easing into a deeper base.
export function markerGradient(hex: string) {
  const soft = mute(hex, 0.18);
  return [shade(soft, 0.28), soft, shade(soft, -0.22)] as const;
}

// The fader fill: a lit core with darker edges, softened like the marker.
export function fillGradient(hex: string) {
  const soft = mute(hex, 0.12);
  return [shade(soft, -0.45), shade(soft, 0.1), shade(soft, 0.5), shade(soft, -0.05)] as const;
}
