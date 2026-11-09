import { ActivityIndicator, Image, View } from 'react-native';
import { useTheme } from '../theme';

export default function IconLoading() {
  const theme = useTheme();
  return <View accessibilityLabel="Loading mixer" accessibilityRole="progressbar" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
    <Image source={require('../../assets/icon.png')} accessible={false} fadeDuration={0} style={{ width: 180, height: 180, borderRadius: 36 }} />
    <ActivityIndicator color={theme.tint} />
  </View>;
}
