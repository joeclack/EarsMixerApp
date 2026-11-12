# EarsMixerApp

Native iOS and Android app for personal monitor mixing with [EarsMixer](https://github.com/joeclack/EarsMixer). Built with Expo SDK 58 and React Native, with a browser preview.

Check out /screenshots for in-app screenshots

## Features

- Select an AUX and adjust channel send levels or pan.
- Horizontal portrait faders, a vertical landscape bank, and a tall single-fader view.
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
- **CI previews:** GitHub Actions builds Android APK and iOS simulator artifacts. Downloadable Android previews are also listed under [Releases](https://github.com/joeclack/EarsMixerApp/releases).

Version: **0.1.0**. Expo reads it from `package.json`; build profiles are in [eas.json](eas.json). See [CHANGELOG.md](CHANGELOG.md) for changes.
