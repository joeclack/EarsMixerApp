import { router, Stack } from 'expo-router';
import { ScrollView, Text } from 'react-native';
import { useSession } from '../src/mixer/context';
import { useTheme } from '../src/theme';
import { Icon, Row, Section } from '../src/components/ui';
import NativeButton from '../src/components/NativeButton';
export default function Mixes() {
  const { session, mix } = useSession();
  const theme = useTheme();
  return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 20 }}>
    <Stack.Screen options={{ headerRight: () => <NativeButton title="Done" onPress={() => router.back()} /> }} />
    <Section footer="Choose the AUX send for your monitor mix.">
      {mix.config?.aux.map(aux => <Row key={aux.channel} title={aux.label} detail={'AUX ' + aux.channel} onPress={() => { session.preferences({ selectedAux: aux.channel }); router.back(); }}>
        {mix.aux === aux.channel && <Icon name={{ ios: 'checkmark', android: 'check', web: 'check' }} />}
      </Row>)}
      {!mix.config?.aux.length && <Text style={{ padding: 20, color: theme.muted }}>Your available mixes will appear when the desk is connected.</Text>}
    </Section>
  </ScrollView>;
}
