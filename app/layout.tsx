import { Redirect, useLocalSearchParams } from 'expo-router';
// Edit channels is now the Channels tab.
export default function LayoutEditor() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  return <Redirect href={{ pathname: '/channels', params: tab ? { tab } : {} }} />;
}
