import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { addOrientationChangeListener, getOrientationAsync, Orientation } from 'expo-screen-orientation';

export function useLandscapeEdgePadding(left: number, right: number) {
  const [orientation, setOrientation] = useState(Orientation.UNKNOWN);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let active = true, changed = false;
    const listener = addOrientationChangeListener(event => {
      changed = true;
      if (active) setOrientation(event.orientationInfo.orientation);
    });
    void getOrientationAsync().then(value => { if (active && !changed) setOrientation(value); }).catch(() => {});
    return () => { active = false; listener.remove(); };
  }, []);
  const inset = Math.max(left, right);
  if (!inset) return { paddingLeft: 0, paddingRight: 0 };
  // Prefer asymmetric cutout insets. iOS may reserve equal space at both edges;
  // in that case the interface orientation identifies the front-camera edge.
  const notchOnRight = right > left || (right === left && orientation === Orientation.LANDSCAPE_LEFT);
  return notchOnRight ? { paddingLeft: 0, paddingRight: inset + 20 } : { paddingLeft: inset + 20, paddingRight: 0 };
}
