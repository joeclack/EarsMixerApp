import Constants from 'expo-constants';
import { Platform } from 'react-native';

// The version shown in Settings, with the native build number when the
// platform reports one, for example "0.1.0 (5)".
//
// The version comes from the app config (package.json), so an over-the-air
// update keeps it current. The build number is read from the installed binary
// (CFBundleVersion on iOS, versionCode on Android), so it always names the
// TestFlight or store build the update is running on.
export function appVersionLabel(): string {
  const version = Constants.expoConfig?.version;
  if (!version) return '—';
  const build = Platform.OS === 'ios' ? Constants.platform?.ios?.buildNumber
    : Platform.OS === 'android' ? Constants.platform?.android?.versionCode
    : null;
  return build ? `${version} (${build})` : version;
}
