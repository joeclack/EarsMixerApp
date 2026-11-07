# Changelog

## Unreleased

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
