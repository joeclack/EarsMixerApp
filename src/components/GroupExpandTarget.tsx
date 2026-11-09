import type { PropsWithChildren } from 'react';
import { Pressable } from 'react-native';

// Keep the tap target on the title/display, away from the fader's drag gesture.
export default function GroupExpandTarget({ label, onExpand, children }: PropsWithChildren<{ label: string; onExpand(): void }>) {
  return <Pressable accessibilityRole="button" accessibilityLabel={'Open ' + label + ' group'}
    accessibilityHint="Adjust individual channels" accessibilityState={{ expanded: false }}
    onPress={onExpand} style={({ pressed }) => ({ width: '100%', opacity: pressed ? 0.75 : 1 })}>
    {children}
  </Pressable>;
}
