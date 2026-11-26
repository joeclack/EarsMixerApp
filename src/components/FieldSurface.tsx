import type { PropsWithChildren } from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import HardwarePanel from './HardwarePanel';

export default function FieldSurface({ children, style, multiline = false }: PropsWithChildren<{
  style?: StyleProp<ViewStyle>; multiline?: boolean;
}>) {
  const android = Platform.OS === 'android';
  // Keep the corners clear of text as the message field grows across lines.
  const radius = android ? (multiline ? 26 : 999) : 18;
  return <HardwarePanel radius={radius} style={[{ paddingHorizontal: android ? 20 : 16 }, style]}>{children}</HardwarePanel>;
}
