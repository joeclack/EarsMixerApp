import { useLayoutEffect, useRef, useState } from 'react';

// An orientation change reports its geometry in stages (window size, safe-area
// insets, the interface orientation, then measured list height). Wait until
// those have stopped changing briefly before showing the new layout. Other
// geometry changes only hide stale layout for a single frame.
const ROTATION_SETTLE_MS = 100;

export function useStableMixerLayout(geometry: string, orientation: string) {
  const [settled, setSettled] = useState(geometry);
  const settledOrientation = useRef(orientation);
  useLayoutEffect(() => {
    if (settled === geometry) return;
    if (settledOrientation.current !== orientation) {
      // Any newer stage restarts the wait through this effect's cleanup.
      const timer = setTimeout(() => { settledOrientation.current = orientation; setSettled(geometry); }, ROTATION_SETTLE_MS);
      return () => clearTimeout(timer);
    }
    const frame = requestAnimationFrame(() => setSettled(geometry));
    return () => cancelAnimationFrame(frame);
  }, [geometry, orientation, settled]);
  return settled === geometry;
}
