import { useColorScheme } from 'react-native';
import { useAppearance } from './mixer/context';
export function useTheme() {
  const system = useColorScheme();
  const appearance = useAppearance();
  const dark = (appearance === 'system' ? system : appearance) === 'dark';
  return {
    dark, scheme: dark ? 'dark' as const : 'light' as const,
    bg: dark ? '#0B1015' : '#EEF2F3', panel: dark ? '#182129' : '#FFFFFF',
    secondary: dark ? '#2B3740' : '#DBE4E8', text: dark ? '#F5F5F7' : '#1C1C1E',
    muted: dark ? '#98989F' : '#6C6C70', line: dark ? '#38383A' : '#E5E5EA',
    tint: dark ? '#48D8C4' : '#007D71', green: dark ? '#30D158' : '#248A3D',
    danger: dark ? '#FF453A' : '#D70015', orange: dark ? '#FF9F0A' : '#B25000',
  };
}
