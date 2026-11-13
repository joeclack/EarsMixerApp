import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme';
import AppBackground from './AppBackground';

// A single fixed background per screen. Native sheets retain their own clipping
// and presentation; controls draw their standard materials above this surface.
export default function ScreenSurface({ children, desk = false }: PropsWithChildren<{ desk?: boolean }>) {
  const theme = useTheme();
  return <View style={{ flex: 1, backgroundColor: desk ? theme.deskBg : theme.bg }}>
    <AppBackground desk={desk} />
    {children}
  </View>;
}
