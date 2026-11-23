// Metro configuration. Expo's defaults, plus the commit each JavaScript bundle
// is built from, which Settings › About shows. EXPO_PUBLIC_ variables are
// inlined into the bundle, so every over-the-air update carries its own commit
// without changing the app config or the native fingerprint.
const { execSync } = require('node:child_process');
const { getDefaultConfig } = require('expo/metro-config');

if (!process.env.EXPO_PUBLIC_BUNDLE_COMMIT) {
  const commit = process.env.EAS_BUILD_GIT_COMMIT_HASH || (() => {
    try { return execSync('git rev-parse HEAD', { cwd: __dirname, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; }
  })();
  if (/^[0-9a-f]{7,40}$/.test(commit)) process.env.EXPO_PUBLIC_BUNDLE_COMMIT = commit.slice(0, 7);
}

module.exports = getDefaultConfig(__dirname);
