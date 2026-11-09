import { memo, useState } from 'react';
import { Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FADER_CAP_HEIGHT, FADER_CAP_WIDTH } from './faderGeometry';
import { faderArtwork } from './faderArtwork';

// Reuse the icon's sculpted graphite artwork rather than approximating its
// concavity with flat strips. Both orientations use the identical proportions.
export default memo(function FaderHandleSurface({ vertical, size = 1 }: {
  vertical: boolean; size?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  return <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
    <View style={{ position: 'absolute', width: FADER_CAP_WIDTH, height: FADER_CAP_HEIGHT,
        left: vertical ? FADER_CAP_WIDTH * (size - 1) / 2 : (FADER_CAP_HEIGHT - FADER_CAP_WIDTH) / 2,
        top: vertical ? FADER_CAP_HEIGHT * (size - 1) / 2 : (FADER_CAP_WIDTH - FADER_CAP_HEIGHT) / 2,
        transform: vertical ? [{ scale: size }] : [{ rotate: '90deg' }], borderRadius: 8, overflow: 'hidden' }}>
      {/* Always present, including the first frame and failed image loads. */}
      {!loaded && <LinearGradient colors={['#829198', '#283238', '#131B20', '#4F5D65']} style={{ position: 'absolute', inset: 0, borderRadius: 8, borderWidth: 1, borderColor: '#91A0A5' }}>
        <View style={{ position: 'absolute', left: 7, right: 7, top: 4, height: 3, borderRadius: 2, backgroundColor: '#26F5C6' }} />
        <View style={{ position: 'absolute', top: 12, bottom: 10, left: 6, right: 6, borderRadius: 5, backgroundColor: '#303D43', borderLeftWidth: 2, borderRightWidth: 2, borderColor: '#64767E' }} />
        <View style={{ position: 'absolute', top: 29, left: 3, right: 3, height: 2, backgroundColor: '#D4DFE3' }} />
      </LinearGradient>}
      <Image source={faderArtwork} accessible={false} fadeDuration={0} resizeMode="stretch" resizeMethod="resize"
        onLoad={() => setLoaded(true)} onError={() => setLoaded(false)}
        style={{ position: 'absolute', inset: 0, width: FADER_CAP_WIDTH, height: FADER_CAP_HEIGHT }} />
    </View>
  </View>;
});
