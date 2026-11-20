# EarsMixerApp

Native iOS and Android app for personal monitor mixing with [EarsMixer](https://github.com/joeclack/EarsMixer). Built with Expo SDK 58 and React Native, with a browser preview.

Check out /screenshots for in-app screenshots

## Features

- Select an AUX and adjust channel send levels or pan.
- Horizontal portrait faders and a vertical landscape bank.
- Named channel groups, relative level control, channel ordering and visibility.
- Light/dark themes, haptics, connection QR scanning and native server discovery.
- Device-local layouts and saved level states, shared server templates, and offline demo mode.

## Repository layout

- `app/` — Expo Router screens and navigation.
- `src/components/` — shared and platform-specific UI.
- `src/mixer/` — mixer connection, state, grouping and local storage.
- `src/discovery/`, `modules/` — server discovery and its native module.
- `assets/` — images, fader artwork and textures.
- `tests/`, `.maestro/` — automated checks and UI flows.
- `.github/workflows/`, `eas.json` — CI and build profiles.

## Local development

Use Node.js 24 and npm:

```sh
npm ci
npx expo start
```

Open the project in Expo Go, or press **a** for an Android emulator. Use **Try demo** without a mixer server. Native discovery requires a native build; manual addresses and demo mode work in Expo Go.

For a real server, enter its reachable network address, such as `192.168.1.100:8082`. An Android emulator can reach a server on the development computer at `10.0.2.2:8082`.

## Builds and deployment

- **Android/iOS development:** `npm run android` or `npm run ios`; local iOS builds require macOS/Xcode.
- **Internal builds:** link your Expo/EAS project, then run `npx eas-cli build --platform all --profile preview`. The Android preview is an APK; physical iOS builds require Apple signing and registered devices.
- **iOS simulator:** use the `simulator` EAS profile.
- **Store builds:** use the `production` EAS profile and configure the relevant store credentials and submission separately.
- **Web:** `npm run web` for development; `npm run build:web` exports `dist/` for a static host with SPA route fallback. The mixer server must be reachable from the browser and allow the required CORS reads.
- **Previously published previews:** Android APKs are available under [Releases](https://github.com/joeclack/EarsMixerApp/releases).

### TestFlight and over-the-air updates

[The deploy workflow](.eas/workflows/testflight.yml) runs on every push to `main`, including PR merges. It fingerprints the native project and looks for a production iOS build with the same fingerprint:

- **Match found (JavaScript and assets only changed):** it publishes an EAS Update to the `production` channel. Installed TestFlight and App Store builds download it on launch and apply it on the next launch.
- **No match (native code, dependencies with native code, or native config in `app.config.ts` changed):** it builds a new iOS store binary and uploads it to TestFlight.

The runtime version uses the `fingerprint` policy, so an update only reaches builds whose native code matches. EAS increments the build number remotely. The app version still comes from `package.json`. Builds made before `expo-updates` was added cannot receive updates.

To publish an update by hand, run `npx eas-cli@latest update --channel production --platform ios`.

Before merging the workflow:

1. Connect the `EarsMixerApp` GitHub repository in the [Expo project's GitHub settings](https://expo.dev/accounts/joeclack/projects/earsmixer-app/github). The Expo project ID is already set in `app.config.ts`.
2. Create or select the App Store Connect app for `com.joeclack.earsmixerapp`. Add its numeric Apple ID as `submit.production.ios.ascAppId` in [eas.json](eas.json), using a string.
3. Run `npx eas-cli@latest credentials --platform ios`. Select the `production` profile and configure iOS distribution signing and the App Store Connect API key for Expo Submit.
4. If the app already has an uploaded build, initialise the EAS build number with `npx eas-cli@latest build:version:set --platform ios --profile production` using the latest uploaded build number.
5. Validate the workflow with `npx eas-cli@latest workflow:validate .eas/workflows/testflight.yml --non-interactive`. To publish a first build manually, run `npx eas-cli@latest workflow:run .eas/workflows/testflight.yml`.

Version: **0.1.0**. Expo reads it from `package.json`; build profiles are in [eas.json](eas.json). See [CHANGELOG.md](CHANGELOG.md) for changes.

## Development checks

When requested, run `npm run typecheck` and `npm test` from this repository. Use the relevant bundle script in [package.json](package.json) for build checks.

See [contributor guidance](AGENTS.md), the [design system](DESIGN_SYSTEM.md), the [release plan](PLAN.md) and the [security policy](SECURITY.md).
