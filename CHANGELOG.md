# Changelog

## 0.9.0 — Automatic fader transitions

- Ease automatic fader movement out with a fast start and a gentle finish, including setting all sends to off and loading saved levels.
- Scale transition time to travel distance (32–240 ms) so small live desk updates remain responsive. Keep finger dragging immediate.
- Preserve animated movement across refreshes and gesture invalidation; show AUX/parameter changes and initial positions immediately.

## 0.8.0 — Branded startup

- Use the app icon on the native splash screen and while device settings are restored.
- Show the icon and a native activity indicator while connecting or waiting for uncached channel values, with no loading text.
- Keep cached faders visible during background refreshes; isolate loading visibility from the live channel stream.

## 0.7.1 — App icon

- Set the generated teal-fader artwork as the Expo/iOS app icon and web favicon.
- Add an Android adaptive launcher asset with enough clearance to retain all three faders under different icon masks.

## 0.7.0 — Icon faders

- Bring the icon's sculpted graphite cap into the live faders: textured concave grip, teal indicator, silver centre stripe and stronger contact shadow.
- Add a deeply recessed dark housing with a reflected lower rim and a bright, softly glowing teal track in both orientations and appearances.
- Keep the compact row height, use the same cap proportions rotated for portrait, and reserve travel clearance for the larger handle at both endpoints.
- Retain direct UI-thread gestures and incoming desk animation. Cache the cap as a native image rather than rebuilding its material during value updates.

## 0.6.1 — App surfaces

- Use the textured charcoal/silver background throughout Settings, first-time setup, connection and template sheets, channel editing, QR scanning and startup.
- Keep navigation headers transparent and the texture outside safe-area padding so it covers each full screen.
- Let native forms and lists reveal the shared background while keeping native controls and sheet presentation.

## 0.6.0 — Mixer surface

- Add a matte charcoal mixer background with fine static grain, soft blue-grey lighting, a faint teal wash and subtle edge shading.
- Adapt the surface to a light silver finish in light mode and retain the transparent toolbar and existing faders.
- Keep the decorative background fixed behind the channel list, with no animation or touch handling.

## 0.5.3 — Live desk faders

- Deliver received desk positions directly to the animation thread, with a short 32 ms interpolation between updates. Keep finger dragging immediate and stop desk animation when grabbing a handle.
- Separate page/status subscriptions from channel values, so desk packets update only the affected channel instead of re-rendering the mixer screen and toolbar.
- Keep fader scales and handle surfaces stable during value updates; preserve direct jumps for AUX changes, reconnects and cached first display.
- Clear fresh values atomically when changing AUX or Level/Pan. Release accessibility drag tokens so subsequent physical desk movement is accepted.

## 0.5.2 — QR navigation

- Return directly to Mixer or setup after scanning a connection QR code instead of issuing an unconditional POP_TO_TOP.
- Ignore repeated scan events after a successful connection and late navigation after closing the scanner. Allow retry after a failed scan.
- Provide a Mixer fallback when closing a scanner opened without navigation history.

## 0.5.1 — Recent states

- Simplify Recent states in Settings to show only the AUX name and last-edited timestamp.

## 0.5.0 — AUX presence

- Show profile circles and nicknames for other connected users on the selected AUX. Tap the circles to see everyone.
- Update presence on joins, disconnects, nickname changes and AUX changes; clear it while disconnected or switching mixes.
- Requires the server's AUX presence update (Windows 1.5.0 / Node package 2.7.0). Older servers continue to work without presence.

## 0.4.0 — Saved AUX levels

- Save send levels on the phone separately for each mixer and AUX, with channel names and edit times.
- Compare fresh desk levels on opening, reconnecting or switching AUX; ask before restoring saved levels, including hidden channels. Keep pan unchanged.
- Show AUX level summaries and last-edited dates in Settings → Recent states.
- Keep saved states separate from the live display cache so a reconnect cannot overwrite them before a restore decision.

## 0.3.0 — Device layouts and mixer controls

- Show the selected AUX name as the mixer page heading.
- Restore the device-local Haptic feedback toggle, enabled by default.
- Remember the selected template and show its name in the mixer menu.

- Move fader gestures and track animation onto the UI thread; isolate channel readouts and theme/navigation subscriptions from unrelated level updates.
- Add bounded three-tick haptic bursts for fast position jumps.

- Restyle portrait and landscape faders with rectangular caps, backlit grip slits, and labelled scales including 0 dB.

- Add an offline demo with 20 channels, four AUX mixes, local fader/pan control and example templates. Start it from Connect or Settings without contacting a mixer server.

- Replace bottom tabs with a toolbar Settings button and a Settings page that navigates back to Mixer.

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
