import ScreenSurface from '../src/components/ScreenSurface';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme';
import CloseButton from '../src/components/CloseButton';
import TemplatesList from '../src/components/TemplatesList';
// The template sheet opened from setup. After setup, templates live in the Channels tab.
export default function Templates() {
  const theme = useTheme(), insets = useSafeAreaInsets();
  return <ScreenSurface><ScrollView contentContainerStyle={{ padding: 24, paddingTop: 32, paddingBottom: insets.bottom + 24 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 28, fontWeight: '700' }}>Templates</Text>
      <CloseButton onPress={() => router.back()} />
    </View>
    <TemplatesList onApplied={() => router.back()} />
  </ScrollView></ScreenSurface>;
}
