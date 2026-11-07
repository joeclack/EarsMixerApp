import type { ExpoConfig } from 'expo/config';
import { version } from './package.json';

const config: ExpoConfig = {
  name: 'EarsMixer', slug: 'earsmixer-app', version,
  orientation: 'default', userInterfaceStyle: 'dark',
  icon: './assets/icon.png',
  ios: {
    supportsTablet: true, bundleIdentifier: 'com.joeclack.earsmixerapp',
    infoPlist: {
      NSLocalNetworkUsageDescription: 'Connect to your EarsMixer server on the same network to control your monitor mix.',
      // The address is user-configured and mixer networks commonly use HTTP,
      // including qualified DNS names. No TLS certificate validation is disabled.
      NSAppTransportSecurity: { NSAllowsArbitraryLoads: true },
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.joeclack.earsmixerapp',
    permissions: ['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE'],
    adaptiveIcon: { foregroundImage: './assets/icon.png', backgroundColor: '#101215' },
  },
  plugins: [
    ['expo-camera', { cameraPermission: 'Scan the connection QR code from your EarsMixer server.', microphonePermission: false, recordAudioAndroid: false }],
    ['expo-build-properties', { android: { usesCleartextTraffic: true } }],
  ],
  web: { favicon: './assets/favicon.png', bundler: 'metro' },
};

export default config;
