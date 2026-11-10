import { Text, View } from 'react-native';
import { useTheme } from '../theme';

export default function GroupScopeHeading({ allAuxes, mixName, inset = 16 }: { allAuxes: boolean; mixName: string; inset?: number }) {
  const theme = useTheme();
  return <View style={{ marginHorizontal: inset, marginTop: 8, marginBottom: 20, gap: 4 }}>
    <Text style={{ color: theme.muted, fontSize: 13, fontWeight: '600' }}>{allAuxes ? 'Applies to' : 'Only this mix'}</Text>
    <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 22, fontWeight: '700' }}>{allAuxes ? 'All monitor mixes' : mixName}</Text>
  </View>;
}
