import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useAppearance } from './mixer/context';
export function useTheme() {
  const system = useColorScheme();
  const appearance = useAppearance();
  const dark = (appearance === 'system' ? system : appearance) === 'dark';
  return useMemo(() => ({
    dark, scheme: dark ? 'dark' as const : 'light' as const,
    bg: dark ? '#0B1015' : '#E8EFF3', panel: dark ? '#182129' : '#FFFFFF',
    secondary: dark ? '#2B3740' : '#D8E4EB', text: dark ? '#F5F5F7' : '#152B35',
    muted: dark ? '#98989F' : '#475D69', line: dark ? '#38383A' : '#BCCCD5',
    tint: dark ? '#48D8C4' : '#007D71', green: dark ? '#30D158' : '#248A3D',
    danger: dark ? '#FF453A' : '#D70015', orange: dark ? '#FF9F0A' : '#B25000',
    groupSurface: dark ? '#12272C' : '#F7FCFC', groupEdge: dark ? '#48D8C4' : '#007D71',
    consoleRed: '#B42B43', consoleMark: '#A82B40', consoleFace: '#E1DDC9',
    consoleGradient: ['#EEE9D7', '#D4CEB6', '#E4DECA'] as const,
    consoleRim: '#FFF9E3', stripSurface: dark ? '#111C24' : '#DAE4E8',
  }), [dark]);
}
