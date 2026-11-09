import { positionToDb } from './model';

// Match the displayed level precision before encoding commands as OSC floats.
export function dragLevel(position: number): number {
  const value = Math.round(positionToDb(position) * 10) / 10;
  return Object.is(value, -0) ? 0 : value;
}

// A tiny lift movement after the last sampled drag should not change its value.
// Always allow explicit endpoints, including off, and larger final movements.
export function releasePosition(position: number, sampled: number, travel: number): number {
  'worklet';
  if (position <= 0 || position >= 1 || travel <= 0) return position;
  return Math.abs(position - sampled) * travel <= 2 ? sampled : position;
}
