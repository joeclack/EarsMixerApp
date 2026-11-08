import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme';
import AppBackground from './AppBackground';

// A single fixed background per screen. Native sheets retain their own clipping
// and presentation; controls draw their standard materials above this surface.
export default function ScreenSurface({ children }: PropsWithChildren) {
  const theme = useTheme();
  return <View style={{ flex: 1, backgroundColor: theme.bg }}>
    <AppBackground />
    {children}
  </View>;
}
