import { useEffect, useLayoutEffect, useState } from 'react';
import { Platform } from 'react-native';
import { addOrientationChangeListener } from 'expo-screen-orientation';

export function useStableMixerLayout(geometry: string) {
  const [settled, setSettled] = useState(geometry);
  const [rotating, setRotating] = useState(false);
  // Comparing during render removes strips before they render with intermediate
  // dimensions. Restart the quiet period for every safe-area or size update.
  useLayoutEffect(() => {
    if (settled === geometry) return;
    const timer = setTimeout(() => setSettled(geometry), 280);
    return () => clearTimeout(timer);
  }, [geometry, settled]);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const listener = addOrientationChangeListener(() => {
      setRotating(true);
      clearTimeout(timer);
      timer = setTimeout(() => setRotating(false), 280);
    });
    return () => { clearTimeout(timer); listener.remove(); };
  }, []);
  return settled === geometry && !rotating;
}
