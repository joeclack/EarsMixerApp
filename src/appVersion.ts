import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
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

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });

// Details under Settings › About, for telling exactly what's running:
//   Version 1.0.0 (7) · update 01a207c1
//   Bundle 2a49949 · 23 Nov 2026, 09:33 UTC
// The update is the over-the-air update ID, or "built in" when the build's own
// JavaScript is running. The bundle is the commit the JavaScript was built from
// (see metro.config.js) and the date is when the update was published.
export function appUpdateDetails(): string {
  const update = Updates.isEmbeddedLaunch ? 'built in' : Updates.updateId ? 'update ' + Updates.updateId.slice(0, 8) : null;
  const commit = process.env.EXPO_PUBLIC_BUNDLE_COMMIT;
  const created = Updates.createdAt && !Number.isNaN(Updates.createdAt.getTime()) ? dateFormat.format(Updates.createdAt) + ' UTC' : null;
  const bundle = [commit ? 'Bundle ' + commit : null, created].filter(Boolean).join(' · ');
  return ['Version ' + appVersionLabel() + (update ? ' · ' + update : ''), bundle].filter(Boolean).join('\n');
}
