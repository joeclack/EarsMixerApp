import { Asset } from 'expo-asset';
import { Image } from 'react-native';

export const faderArtwork = require('../../assets/faders/graphite-cap.png');
let warming: Promise<void> | undefined;
// Start at app mount, independently of device storage, discovery and desk values.
// Failure must never block rendering; the handle has a synchronous drawn surface.
export function warmFaderArtwork() {
  return warming ??= Asset.fromModule(faderArtwork).downloadAsync()
    .then(asset => Image.prefetch(asset.localUri || asset.uri))
    .then(() => undefined)
    .catch(() => { warming = undefined; });
}
