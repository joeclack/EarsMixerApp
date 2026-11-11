import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { StepNumber } from './ConsoleDetails';
import HardwarePanel from './HardwarePanel';

// Numbered instructions for Android and web, matching the iOS native list.
export default function SetupList({ items }: { items: string[] }) {
  const theme = useTheme();
  return <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }}>
    <HardwarePanel>
      <View accessibilityRole="list">
        {items.map((text, index) => <View key={text} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 16, paddingVertical: 10,
          borderTopWidth: index ? 1 : 0, borderTopColor: theme.line }}>
          <StepNumber value={index + 1} />
          <Text style={{ flex: 1, color: theme.text, fontSize: 17, lineHeight: 23 }}>{text}</Text>
        </View>)}
      </View>
    </HardwarePanel>
  </ScrollView>;
}
