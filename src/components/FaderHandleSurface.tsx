import { memo } from 'react';
import { Image, View } from 'react-native';
import { FADER_CAP_HEIGHT, FADER_CAP_WIDTH } from './faderGeometry';

// Reuse the icon's sculpted graphite artwork rather than approximating its
// concavity with flat strips. Both orientations use the identical proportions.
export default memo(function FaderHandleSurface({ vertical, ready }: {
  vertical: boolean; ready: boolean;
}) {
  return <View pointerEvents="none" style={{ position: 'absolute', inset: 0, opacity: ready ? 1 : 0.45 }}>
    <Image source={require('../../assets/faders/graphite-cap.png')} fadeDuration={0} resizeMode="stretch" resizeMethod="resize"
      style={{ position: 'absolute', width: FADER_CAP_WIDTH, height: FADER_CAP_HEIGHT,
        left: vertical ? 0 : (FADER_CAP_HEIGHT - FADER_CAP_WIDTH) / 2,
        top: vertical ? 0 : (FADER_CAP_WIDTH - FADER_CAP_HEIGHT) / 2,
        transform: vertical ? [] : [{ rotate: '90deg' }] }} />
  </View>;
});
