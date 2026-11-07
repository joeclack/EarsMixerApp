# EarsMixer App

iOS and Android companion for [EarsMixer](https://github.com/joeclack/EarsMixer). Connect your phone to the same network as the EarsMixer server, enter its address or scan the QR code from the server's admin dashboard/tray, then control your monitor mix.

## Native interface · 0.2.0

- Native Mixer, Profile and Settings tabs. iOS uses the system tab bar with Liquid Glass on iOS 26 and newer; Android uses its native tab bar.
- SwiftUI glass buttons, segmented controls, settings forms and drag-to-reorder lists on iOS, with SF Symbols and automatic light/dark appearance.
- Connection opens as a native bottom sheet with two height stops over the current page. Enter an address, use a recent mixer or scan its connection QR code.
- The mixer renders native controls and talks directly to the existing server's WebSocket protocol. The app no longer embeds a WebView.
- Faders only change when their handles are dragged (or through accessibility adjustment actions). Switching mixes, pan/level modes, snapshots, tabs or connections cancels pending writes. Backgrounding the app disconnects live controls.
- Profiles use the local accounts in EarsMixer server 1.4.0 and newer. Layouts, favourites and display names work across web and mobile, with explicit resolution of conflicting edits. Passwords are never stored in device preferences.
- Guests keep per-server layouts on the device. Account edits that could not reach the server remain cached for retry.
- iPad/wide layouts support multiple channel columns. Compact mode and haptic feedback are configurable.

This repository contains only the mobile client. The Windows service, web app, accounts and SQLite database live in [EarsMixer](https://github.com/joeclack/EarsMixer). This release requires no server changes.

Expo SDK **58** is the current stable SDK used by this release. System Liquid Glass requires **iOS 26+** and an SDK 26+ native build. Earlier supported iOS versions use standard native controls; Reduce Transparency is respected. Browser previews use ordinary web controls and cannot reproduce Apple's system glass.

## Run on your phone

Use Node.js 24 and npm:

```sh
npm ci
npx expo start
```

If Windows fails to open the Expo login browser, run npx expo login --no-browser and sign in to the same account used by Expo Go.

Install Expo Go on your phone and scan the development QR code printed by Expo. That code opens the **app project**; the QR scanner inside the app opens your **mixer server**. The development computer and phone must be able to reach each other. Enter the server's network address, such as `192.168.1.100:8082`. On a physical phone, `localhost` refers to the phone itself.

## Android preview APK

**[Download an Android preview](https://github.com/joeclack/EarsMixerApp/releases)** from Releases. Install the APK on an ARM64 Android phone or tablet connected to your mixer network.

After successful checks on `main`, GitHub Actions builds a standalone preview. Open **Actions → Mobile checks and Android preview**, choose a successful run and download **EarsMixerApp-android-preview** from Artifacts. Extract and install the APK on an ARM64 Android device. It includes the JavaScript bundle and does not need Metro or an Expo account. The preview uses the generated development signing key and is not a Google Play production build.

For local native development with an Android SDK installed, run `npm run android`.

## iPhone distribution

Expo Go runs this project for development without provisioning a standalone iPhone app. Standalone physical-device and TestFlight builds require your Apple Developer signing credentials. With your own Expo/EAS account:

```sh
npx eas-cli build:configure
npx eas-cli build --platform ios --profile preview
```

Register physical iPhones for internal distribution as prompted by EAS. Preview, simulator and production profiles are provided. Store submission and production signing are not automated.

## Nearby mixers

Open **Connect** to browse nearby EarsMixer servers. Select a result to connect; the app checks the resolved address and port before opening a mixer session. Discovery does not change audio levels or connect to a server without a tap. It stops when the sheet closes or the app enters the background.

This requires the EarsMixer server’s Bonjour discovery update and a **new native app build**. The local `earsmixer-discovery` Expo module uses Apple Bonjour and Android Network Service Discovery. Expo Go and browsers cannot load it; use manual addresses or QR codes there. For native development, run `npm run ios` on macOS or `npm run android`, or create a signed EAS build for a physical iPhone.

Allow **Local Network** access in iOS Settings. Both devices must be on a network that permits multicast (UDP 5353). If no server appears, use **Search again**, enter its address or scan its QR code.

The Mixer toolbar contains the AUX menu and connection status. Compact channels use shorter rows with the level beside the channel name. Haptics are enabled; the mobile mixer uses one column on all displays. Saved web layout preferences remain compatible.

## Network permissions

The app requests iOS local-network access and camera access for QR scanning, without microphone access. Android cleartext traffic and iOS ATS HTTP access are enabled because musicians connect to their own HTTP mixer servers at arbitrary network addresses and DNS names. HTTPS certificates are still validated normally.

`npm run web` starts a browser preview. Browsers enforce CORS restrictions on the server probe, so native builds are the supported way to connect to arbitrary local servers. The web preview exercises the fallback screens; testing against a server requires a same-origin development proxy. Use an iOS simulator or physical iPhone to verify Liquid Glass.

## Checks

```sh
npm run typecheck
npm test
npm run build:web
npm run build:android-bundle
npm run build:ios-bundle
```

The app version comes from package.json, shared by the build configuration and Settings → About.

The iOS native build workflow compiles a simulator app and runs the Maestro screen flow against the real EarsMixer demo server. Its artifacts include screenshots and the simulator app. Simulator builds do not require Apple signing; installing on a physical iPhone still does.
