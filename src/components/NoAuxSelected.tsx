import { Text, View } from 'react-native';
import { useTheme } from '../theme';
import { Icon } from './ui';

// Shown in place of the faders while no AUX is chosen, which is where the app
// starts until a mix has been picked from the AUX selector.
export default function NoAuxSelected() {
  const theme = useTheme();
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
    <Icon name={{ ios: 'headphones', android: 'headphones', web: 'headphones' }} size={34} color={theme.muted} />
    <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 19, fontWeight: '600' }}>No AUX selected</Text>
  </View>;
}
