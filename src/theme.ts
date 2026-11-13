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
    consoleGradient: ['#BCAD8D', '#F2EBD5', '#D3C7A8'] as const,
    consoleRim: '#FFF9E3', consoleShadow: '#5A422D66',
    // The mixer's desk: one panel with every fader set into a recess cut into it.
    deskBg: dark ? '#0B1015' : '#E6DFC8',
    deskGradient: dark ? ['#1C2A33', '#141F26', '#0F181E'] as const : ['#F2ECD8', '#E6DFC8', '#D9D0B4'] as const,
    deskWell: dark ? 'rgba(7,16,21,0.94)' : 'rgba(222,213,186,0.92)',
    deskWellShadow: dark ? 'rgba(0,0,0,0.8)' : 'rgba(90,66,45,0.35)',
    deskWellEdge: dark ? 'rgba(0,0,0,0.6)' : 'rgba(90,66,45,0.18)',
    deskLip: dark ? 'rgba(160,200,215,0.08)' : 'rgba(255,255,255,0.7)',
    deskDivider: dark ? 'rgba(132,155,165,0.14)' : 'rgba(180,43,67,0.22)',
  }), [dark]);
}
