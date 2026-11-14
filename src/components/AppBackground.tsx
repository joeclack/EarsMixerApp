import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';

// A plain colour layer behind each screen, including its transparent header.
export default memo(function AppBackground({ desk = false }: { desk?: boolean }) {
  const theme = useTheme();
  // The mixer's desk uses the console panel colour; light mode turns cream.
  const bg = desk ? theme.deskBg : theme.bg;
  // Keep this root layer: removing it lets iOS form sheets find and reposition
  // the screen's ScrollView differently between themes.
  return <View collapsable={false} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[StyleSheet.absoluteFill, { backgroundColor: bg }]} />;
});
