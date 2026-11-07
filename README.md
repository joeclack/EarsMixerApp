# EarsMixer App

iOS and Android companion for [EarsMixer](https://github.com/joeclack/EarsMixer). Connect your phone to the same network as the EarsMixer server, enter its address or scan the QR code from the server's admin dashboard/tray, then control your monitor mix.

## Features

- Connect using IP addresses, DNS names, custom ports or HTTPS.
- Scan the existing mixer QR code; camera access is requested only when scanning.
- Remember up to five servers on the device and reconnect with one tap.
- Use the existing mixer in a persistent native WebView: AUX selection, handle-only faders, pan, favourites and layouts come from your running server.
- With EarsMixer server 1.4.0 or newer, sign in under **Mixer controls → Your profile** to share your name and saved layout between web and mobile. Accounts and layouts are stored in the server's local SQLite database; no cloud account is required.
- Retry, reload or change servers. Android Back returns to server selection.
- Support phones and tablets in portrait and landscape.

The app checks `/api/connection` before opening a server and keeps the address entered by the user. Console connectivity remains the responsibility of the existing EarsMixer server.

## Run on your phone

Use Node.js 24 and npm:

```sh
npm ci
npx expo start
```

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

## Network permissions

The app requests iOS local-network access and camera access for QR scanning, without microphone access. Android cleartext traffic and iOS ATS HTTP access are enabled because musicians connect to their own HTTP mixer servers at arbitrary network addresses and DNS names. HTTPS certificates are still validated normally.

`npm run web` starts a browser preview. Browsers enforce CORS restrictions on the server probe, so native builds are the supported way to connect to arbitrary local servers. The web preview is useful for developing the connection UI.

## Checks

```sh
npm run typecheck
npm test
npm run build:web
npm run build:android-bundle
```

The app version comes from `package.json`, shared by the build configuration and the connection-screen version label.
