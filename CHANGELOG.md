# Changelog

## Unreleased

- Replace mobile favourites with per-AUX hidden channels, controlled in Edit channels and saved locally. Preserve visibility from legacy layouts and server templates.

- Add a four-step first-launch walkthrough for nickname, connection, faders and device-local layouts. Repeat setup after resetting device data.

- Reconnect to the last saved server on startup; otherwise automatically connect to a single discovered desk and show the connection sheet for multiple desks.

- Cache last-known send levels and pan per server/AUX for offline display; enable dragging only after fresh desk values arrive. Cached values are never recalled to the desk.

- Keep the connection while iOS is inactive and retain channel/AUX metadata when backgrounded or reconnecting.
- Cache channel names per server on the device; re-read live levels before enabling faders after reconnecting.

- Combine identity and settings into one screen with a device-local nickname; remove account and password flows from the mobile app.
- Automatically persist layouts and settings on the device.
- Add vertical faders in landscape and a teal console palette.
- Check recently used servers alongside Bonjour discovery.

- Discover nearby servers with native iOS Bonjour and Android NSD; retain manual and QR connections.
- Move AUX selection into a native toolbar menu alongside connection status. Remove the AUX sheet and connected-address label.
- Use compact page headers, shorter compact channel rows and a single-column mixer.
- Remove haptic and grid settings; keep haptics enabled. Place Disconnect beside the server address.
- Simplify Profile, Settings and connection text.

## 0.2.0 — Native interface

- Replace the embedded web mixer with native Mixer, Profile and Settings screens on Expo SDK 58.
- Use native iOS Liquid Glass tabs, sheet presentation and SwiftUI controls, with SF Symbols, light/dark appearance and accessible fallbacks.
- Present connection and recent mixers in a partial-height sheet; keep QR scanning available.
- Connect directly to EarsMixer's live mixer protocol and local account APIs.
- Preserve handle-only fader dragging, pan, favourites, saved layouts, conflict resolution and per-server guest preferences.
- Add native iOS channel reordering, compact channels, adaptive grids and optional haptics.
- Cancel pending audio writes when changing context or moving the app to the background.
- Add protocol/account regression tests and iOS simulator build/UI checks.

## 0.1.0 — First preview

- Native connection screen, QR scanning and recent servers.
- Embedded web mixer with server-backed accounts and layouts.
- Standalone ARM64 Android preview APK.
