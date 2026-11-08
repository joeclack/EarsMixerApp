import { Pressable } from 'react-native';
import { Icon } from './ui';
export default function CloseButton({ onPress }: { onPress(): void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel="Close connection sheet" onPress={onPress} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name={{ android: 'close', web: 'close' }} /></Pressable>;
}
