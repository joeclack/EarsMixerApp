import { useLayoutEffect, useState } from 'react';

export function useStableMixerLayout(geometry: string) {
  const [settled, setSettled] = useState(geometry);
  // Hide stale geometry for a layout frame, without an artificial rotation
  // timeout. A newer viewport or safe-area update supersedes this frame.
  useLayoutEffect(() => {
    if (settled === geometry) return;
    const frame = requestAnimationFrame(() => setSettled(geometry));
    return () => cancelAnimationFrame(frame);
  }, [geometry, settled]);
  return settled === geometry;
}
