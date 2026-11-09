import type { PropsWithChildren } from 'react';
import { Platform, Pressable } from 'react-native';

// Keep the hold target on the title/display, away from the fader's drag gesture.
export default function GroupExpandTarget({ label, onExpand, children }: PropsWithChildren<{ label: string; onExpand(): void }>) {
  return <Pressable accessibilityRole="button" accessibilityLabel={'Open ' + label + ' group'}
    accessibilityHint="Touch and hold to adjust individual channels" accessibilityState={{ expanded: false }}
    accessibilityActions={[{ name: 'activate', label: 'Expand group' }]} onAccessibilityAction={onExpand} onAccessibilityTap={onExpand}
    delayLongPress={450} onLongPress={onExpand} onPress={event => {
      // Keyboard activation on web has no click count. Pointer users hold;
      // assistive technologies also have the explicit activation action above.
      if (Platform.OS === 'web' && (event.type === 'keyup' || (event.nativeEvent as unknown as { detail?: number } | undefined)?.detail === 0)) onExpand();
    }} style={({ pressed }) => ({ width: '100%', opacity: pressed ? 0.75 : 1 })}>
    {children}
  </Pressable>;
}
