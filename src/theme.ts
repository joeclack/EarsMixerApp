import { useColorScheme } from 'react-native';
import { useSession } from './mixer/context';
export function useTheme() {
  const system = useColorScheme();
  const { state } = useSession();
  const dark = (state.settings.appearance === 'system' ? system : state.settings.appearance) === 'dark';
  return {
    dark, scheme: dark ? 'dark' as const : 'light' as const,
    bg: dark ? '#000000' : '#F2F2F7', panel: dark ? '#1C1C1E' : '#FFFFFF',
    secondary: dark ? '#2C2C2E' : '#E5E5EA', text: dark ? '#F5F5F7' : '#1C1C1E',
    muted: dark ? '#98989F' : '#6C6C70', line: dark ? '#38383A' : '#E5E5EA',
    tint: dark ? '#0A84FF' : '#007AFF', green: dark ? '#30D158' : '#248A3D',
    danger: dark ? '#FF453A' : '#D70015', orange: dark ? '#FF9F0A' : '#B25000',
  };
}
