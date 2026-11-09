import { Pressable } from 'react-native';
import { Icon } from './ui';
export default function CloseButton({ onPress, label = 'Close connection sheet' }: { onPress(): void; label?: string }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name={{ ios: 'xmark', android: 'close', web: 'close' }} /></Pressable>;
}
