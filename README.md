# EarsMixer App

Native iOS and Android companion for [EarsMixer](https://github.com/joeclack/EarsMixer). Control your own DiGiCo monitor mix over the local network, with layouts and preferences saved on your phone.

Current app version: **0.15.0**. Use the latest [EarsMixer server](https://github.com/joeclack/EarsMixer/releases/latest), currently **1.7.0**, for discovery, shared templates and connected-user presence. This repository contains the mobile client; the server repository contains the console connection, browser mixer, admin dashboard and Windows service. Musicians use optional device-local nicknames, without accounts or passwords. The server's admin password is separate.

## Using the app

First-time setup guides you through choosing a nickname, checking your Wi-Fi and mixer connection, optionally choosing a template, using the faders and keeping your layout.

In portrait, the toolbar shows the selected AUX name with a small **Monitor mix** label, followed by:

- **Wi-Fi:** connection status and the connection sheet. Disconnected status is red.
- **Headphones:** choose the AUX you want to control.
- **…:** choose Level or Pan, open Templates, Edit channels, or Set all levels to off. The Templates item includes the selected template's name.
- **Settings:** opens a separate page with a back button to the mixer.

Portrait uses compact horizontal faders. Landscape uses narrow vertical strips with space for the Dynamic Island, with the header and toolbar hidden to give the faders the full height. Rotate back to portrait to access the toolbar.

Landscape strips have a small illuminated display with the channel name and current dB level (or pan position in Pan mode). Red outlines, cream fader faces, printed red scales and inward-pointing 0 dB arrows echo the physical desk. The arrows follow the same level scale as the handle, rather than marking the geometric centre. Swipe horizontally to reach more strips.

Drag a handle to change its value; tapping or scrolling over the track does not jump the level. Touch movement is optimistic and immediate. Changes from the desk, saved-level recall and bulk level changes animate into position, with larger moves easing out. Keyboard and accessibility adjustments are also supported.

**Set all levels to off** sets every available channel send on the selected AUX to −∞ (−150 dB), including hidden channels, after confirmation. It changes the send levels rather than toggling mute; it leaves pan unchanged.

Other people connected to the same AUX appear as profile circles above the faders. Tap the circles to see their nicknames. Older servers without presence support simply show no circles.

## Connection and discovery

Keep the phone, EarsMixer server and console on a network that allows them to communicate. Open the Wi-Fi button for two connection methods:

- **Auto:** browse nearby mixers and select one to connect.
- **Manual:** enter the server address, scan its QR code, or choose a recent server.

Startup tries the last saved server first. If there is no successful connection, it looks for nearby servers: one result connects automatically; multiple results open the connection sheet. Choosing Disconnect clears the saved automatic reconnect target for a real server.

Native discovery uses Bonjour/mDNS (`_earsmixer._tcp`, UDP 5353), including the server's actual web port. It requires a standalone/development native build containing the local `earsmixer-discovery` module. Allow **Local Network** access on iOS. Guest Wi-Fi isolation, blocked multicast and VLAN boundaries can prevent discovery; manual addresses and QR codes remain available. Recent addresses can also be checked for availability.

Expo Go and browser previews cannot load the native discovery module. For native development, use `npm run ios` on macOS, `npm run android`, or a signed EAS build.

## Local data, cached values and saved states

The app saves changes automatically:

- Nickname, appearance and the haptic feedback preference stay on the device.
- Channel order, selected AUX and selected template are stored separately for each server. Hidden channels are stored per AUX. Use **… → Edit channels** to reorder or hide unwanted channels; there are no favourites or compact-mode switches.
- Channel metadata and last-known Level/Pan values are cached locally. The fader bank appears as soon as channel metadata is available, while live values refresh independently. Handle artwork preloads at startup, with a drawn surface visible immediately during image decoding. Dragging waits for fresh values. While settings or channel metadata load, three abstract faders animate independently without loading text. Reduce Motion shows static faders.
- The display cache is never automatically written to the desk. Separately, edits on this phone save a level state for each server/AUX. On opening, reconnecting, returning to the app or switching AUX, differing live and saved levels prompt **Keep desk levels** or **Load saved levels**. Only confirming recall applies those saved send levels, including hidden channels; pan is unchanged.

**Settings → Recent states** lists each saved AUX name and its last-edit date/time. **Reset device data** clears this phone's nickname, layouts, hidden channels, preferences, connections, cached values and saved states, then returns to setup. It does not change desk levels or pan. Uninstalling the app removes its local data.

The operating system can suspend networking when the app is backgrounded. EarsMixer preserves its cached display, closes live controls in the background and reconnects when active. Cached values do not mean the phone is still controlling the console.

## Channel groups

Open **… → Channel groups**, or **Edit channels → Manage channel groups**. Select two or more channels and tap **Group selected**. Each channel can belong to one group per AUX. Group membership is saved on this device separately for each server and AUX; applying a shared template keeps your groups.

The mixer shows a linked-channel marker and one fader titled with all member names, such as **Guitar L / Guitar R**. Tap **Open** to adjust the individual channels inside one connected group frame and **Close** to return to the group fader. In landscape, member strips replace the collapsed fader inside that frame; group controls sit in a shared header rail so all faders retain equal travel. Creating, opening, closing or removing a group does not change levels. Hidden or unavailable members make that group display as individual visible channels until every member is available again.

The group level represents its loudest member. Moving it applies the same dB change to each member, preserving their balance: 0/−5 dB becomes −10/−15 dB when the group is lowered to −10 dB. The quieter member can reach off first; the group bottom sets all members off. Raising the group again restores its remembered offsets. Channels already individually off remain off until raised individually. If every member was individually off and no balance was previously recorded, open the group to raise a channel first.

Individual edits and fresh desk changes establish the next group balance. Controls wait for fresh values from every member after a reconnect. Pan mode shows the individual channels and never links their pans. Group movements send ordinary per-channel commands to the server, so writes are not atomic on the console.

## Templates

Open **… → Templates** to choose an optional shared layout from the server. Templates appear in a simple list with a Select button and an indication of the current selection. Applying a template changes layout preferences, not console levels. A separate saved-level prompt may appear if the template selects a different AUX.

Administrators manage shared templates in the server dashboard. The limited server-hosted browser mixer does not offer template selection. Older favourites-based templates retain their visible-channel selection when loaded in mobile.

## Appearance and interaction

Light mode uses a clean daylight background, white settings cards, dark labels and cream fader faces with red scales in both orientations. Dark mode uses textured graphite surfaces and recessed portrait fader housings. Both modes use illuminated teal tracks and sculpted rectangular handles with centre markers. Settings and setup share restrained hardware details while native buttons, pickers, switches and sheets retain their system styling. Choose System, Light or Dark in Settings.

The generated fader artwork remains the launcher icon. Loading screens use three simple animated faders, independent of console data and image assets. When ready, the faders zoom towards you and fade out over the ready screen; Reduce Motion uses a short fade without zooming. New native builds use a plain initial launch background before the animation can render; Expo Go retains its own initial launch screen. In development, open **Settings → Developer tools → Preview loading animation** to view the loader; tap **Done** to test the same fly-out before returning to Settings.

Fader haptics follow gesture travel rather than delayed desk feedback. **Settings → Haptic feedback** controls slider and success haptics. Brief confirmations appear after applying a template, loading saved levels or setting all sends to off. Selection and setup transitions respect reduced motion, and confirmations support screen readers.

System Liquid Glass requires **iOS 26+** and an SDK 26+ native build. Earlier supported iOS versions use standard native controls. Browser previews cannot reproduce Apple's system materials.

Channel colour accents and live signal meters are future features, tracked in [#3](https://github.com/joeclack/EarsMixerApp/issues/3) and [#4](https://github.com/joeclack/EarsMixerApp/issues/4). Desk OSC compatibility still needs verification; these features are not included in this version.

## Demo mode

Choose **Try demo** in the connection sheet or Settings to explore **20 channels, four AUX mixes and sample templates** without a server. Faders, pan, hiding and reordering work locally. Demo data uses separate layout storage, makes no HTTP or WebSocket connection, and does not replace the last saved real server. Disconnect to leave demo mode, or connect to a real server.

This is separate from the server repository's `npm run dev` demo, which exposes **20 channels and eight AUXes** over the network so the mobile app can exercise a real server connection.

## Run on your phone

This project uses Expo SDK **58**. Use Node.js 24 and npm:

```sh
npm ci
npx expo start
```

Install Expo Go and scan the development QR code printed by Expo. That code opens the **app project**; the QR scanner inside the app opens your **mixer server**. The development computer and phone must be able to reach each other. Enter a server address such as `192.168.1.100:8082`; `localhost` on a physical phone refers to the phone itself.

If Windows cannot open the Expo login browser, run `npx expo login --no-browser` and sign in to the same account used by Expo Go.

The app requests local-network access and camera access for QR scanning, without microphone access. Android cleartext traffic and iOS ATS HTTP access are enabled for local HTTP servers at user-entered addresses. HTTPS certificates are validated normally.

`npm run web` starts a browser preview. Browsers enforce CORS restrictions on server probes; native builds are the supported way to connect to arbitrary local servers. Browser testing against a server needs suitable same-origin proxying. The built-in local demo needs no server.

## Android preview APK

**[Download an Android preview](https://github.com/joeclack/EarsMixerApp/releases)** from Releases and install it on an ARM64 Android phone or tablet on your mixer network.

After successful checks on `main`, GitHub Actions builds a standalone preview. Under **Actions → Mobile checks and Android preview**, download **EarsMixerApp-android-preview** from a successful run's Artifacts. Extract and install the APK. It includes the JavaScript bundle and does not need Metro or an Expo account. The preview uses a generated development signing key and is not a Google Play production release.

For local development with an Android SDK installed, run `npm run android`.

## iPhone builds and store distribution

Expo Go supports development without provisioning a standalone iPhone app. Physical-device and TestFlight builds require Apple Developer signing credentials. Link the project to your own Expo/EAS account and configure signing:

```sh
npx eas-cli build:configure
npx eas-cli build --platform ios --profile preview
```

Preview, simulator and production profiles are provided in [eas.json](eas.json). Register physical iPhones for internal distribution when prompted. Production builds can use the production profile; App Store/Google Play submission, store listings and production signing are not automated.

The **iOS native build and UI** workflow builds a simulator app and runs the Maestro screen flow against the server demo. Artifacts include screenshots and the simulator app. Simulator builds do not require Apple signing; physical-device builds do.

## Development checks

Run the checks appropriate to the change:

```sh
npm run typecheck
npm test
npm run build:web
npm run build:android-bundle
npm run build:ios-bundle
```

The version in [package.json](package.json) is shared by Expo and **Settings → About**. See [CHANGELOG.md](CHANGELOG.md) for release history.
