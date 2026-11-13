# Changelog

## 0.4.0 — Taller landscape faders, sliding groups

- Give landscape faders more height: channel names are one line (shrinking slightly to fit long names) and sit just above the home indicator, with tighter spacing around the level and name. Group names now sit on the same line as channel names.
- Opening or closing a group slides it open or shut, pushing the channels after it along (or down, in portrait) while its members fade in or out. Follows the system Reduce Motion setting.

## 0.3.0 — Landscape on the desk, plain levels

- Landscape faders now sit straight on the desk like portrait, as strips divided by fine lines, with no housings or group cards. Each strip has three rows: its level at the top, the fader in the middle taking all the remaining height, and its name at the bottom. A closed group's name has a chevron to open it; an open group keeps its side rail and gets an accent line along the top.
- Each vertical fader track is a slot cut through the panel.
- Show the level as plain text instead of in a small display, in both orientations.

## 0.2.1 — Faders straight on the desk

- In portrait, faders now sit straight on the desk with fine lines between channels, without the recess around them. Groups, fader slots and the desk background are unchanged.

## 0.2.0 — Faders set into the desk

- In portrait, every fader now sits in one recess cut into the desk instead of its own raised housing, with fine lines between channels. The recess runs on past the bottom of the screen while more channels remain.
- Groups are rows inside the recess: a collapsed group shows its header and group fader; an open group's members follow with an accent line down the left.
- Each fader track is a slot cut through the panel.
- The mixer screen uses the desk as its background; in light mode it is the cream console colour. Other screens are unchanged, and landscape keeps its separate strips.

## 0.1.0 — First TestFlight beta

- Reset the public app version to **0.1.0** for the first shared TestFlight / external beta. Earlier `0.x` entries below were local development only and were never published to testers or the stores.

## 0.20.0 — Setup walkthrough, connection and fader refinements

- Give faders a soft neumorphic housing that rises out of the page, with a translucent edge, softer light-mode rim and an inlaid red pinstripe. Use the textured background in light mode too.
- Rework the iOS mixer toolbar: a leading capsule shows and changes the current AUX, with options and settings grouped on the right. Fix the landscape rail misalignment when the notch is on the right.
- Move the mixer connection into Settings, now the first section, with a clear status and Change action; remove recent states from Settings. Stack the connect sheet's Connect and Scan code buttons as full-width capsules.
- Show a persistent notice when the mixer connection has been lost for 8 seconds, linking to Settings and confirming when it reconnects.
- Make fader haptics follow handle movement on the UI thread, with simulated detents instead of value-based bursts.
- Grow the tall fader out of the pressed bar, open it after a shorter 150 ms hold, and keep its background continuous with the header.
- Hide faders while rotating until the new layout settles, then fade it in.
- Redesign setup around feature previews and native numbered lists, add a Go landscape step, and feature the tall fader with draggable, holdable practice faders.
- Rebuild Android settings, channel groups, group editing and channel order as native Material lists, and bring Android buttons and landscape rail controls in line with iOS.

## 0.19.0 — Landscape controls and refined fader interaction

- Add matching native circular landscape controls for AUX selection, Level/Pan mode and setting all levels to off. Centre the rail vertically, label the current mode, use an infinity icon for off, and provide optional button haptics.
- Keep the landscape toolbar and mixer on one shared background, soften scrolling edges, and protect controls from the notch and rounded corners in either orientation.
- Remove fixed rotation blanking delays and keep faders mounted while layout measurements settle, hiding intermediate geometry without repeated rebuilds.
- Give the tall fader a fully rounded housing, a centred display that fits its text, and a close button below it.
- Add press growth and a shorter expansion hold with a delayed, cancellable haptic. Scrolling and handle holds do not expand; grabbing a handle for adjustment has its own light haptic.
- Simplify the project README around purpose, repository layout, development and deployment.


## 0.18.0 — Landscape AUX toolbar and tall faders

- Add a fixed left-side landscape AUX selector with a native circular iOS menu and the selected mix name when space allows. Keep the faders full height and use a native browser select on web.
- Long press a portrait fader bar to open a larger vertical fader with a digital channel/level display, a larger handle and longer travel for finer control. Preserve the mixer toolbar and provide an X to return to the list.
- Add a light haptic when opening the tall fader and a 180 ms crossfade with subtle scaling when opening or closing. Preserve list scroll position, keep controls responsive during the transition, and use a short fade with Reduce Motion.
- Remove the scale ticks beneath the 0 dB arrows in vertical faders.
- Include the group editing and ordering refinements, loading animation timing, smooth AUX transitions, router configuration, landscape corner clearance, light-mode sheet layout and consistent panel borders from the 0.17 feedback cycle.


## 0.17.11 — Consistent light-mode panel borders

- Apply a single border colour to all light-mode hardware panels, including input housings and cards, removing the contrasting bottom rim.

## 0.17.10 — Light-mode connection sheet

- Retain a native background layer in light mode so iOS form sheets do not reposition the content ScrollView differently from dark mode. Give the connection ScrollView an explicit flexible viewport.

## 0.17.9 — Consistent toast border

- Use one border colour around confirmation toasts, removing the contrasting bottom rim and its visible colour split at the corners.

## 0.17.8 — Extra corner clearance

- Increase landscape corner padding from 12 to 16 points.

## 0.17.7 — Landscape corner clearance

- Add 12 points of spacing on the landscape edge without a notch so rounded phone corners do not clip the channel displays. Retain the larger inset on the notch side.

## 0.17.6 — Landscape notch spacing

- Apply landscape mixer edge padding only on the camera-cutout side, swapping it when the phone rotates. Remove padding on the opposite edge, using orientation when iOS reports symmetric safe areas.

## 0.17.5 — Create in the toolbar

- Move the group Create action to the top-right native toolbar (web header), retaining its blue text, validation and saving state. Remove the bottom form button.

## 0.17.4 — Smooth AUX changes

- Hold displayed fader positions while the next AUX has no values, then glide directly to its cached or live values. Avoid snapping to off on AUX changes or cancelled gestures while values are pending.

## 0.17.3 — Explicit router configuration

- Replace the deprecated initialRouteName setting with anchor. Explicitly present the groups list and editor as pushed card screens, including when reached from the channel-order modal.

## 0.17.2 — More visible loading fly-out

- Slow the loading exit to 650 ms, let the faders grow visibly before flying beyond the screen, and delay the fade. Apply the same timing to the preview Done action; retain the short fade with Reduce Motion.

## 0.17.1 — Simpler group screens

- Use native iOS swipe-to-delete and put Create new group in the groups list. Remove selection controls.
- Move the blue, centred Create action to the bottom of the form, show the current monitor mix name, and remove explanatory footers.
- Keep the connection toolbar button on the mixer page only.

## 0.17.0 — Reorder groups as units

- Show each group as one linked row with its name and channel count in Edit channels. Move the whole group with native iOS drag handles or Up/Down controls on Android/web, and open its editor to change membership or internal order.
- Place new groups at their earliest selected channel, append added members inside the group, and preserve the group's position when editing its member order. Removed members follow the group; deleted groups leave their channels together in member order.
- Show/hide entire groups from their layout row, retain unavailable saved channel IDs, and reject stale reorder actions after a mixer, AUX or layout change. Keep the existing shared layout order across monitor mixes and independent AUX levels/balances.

## 0.16.2 — Group spacing and close icon

- Rotate the landscape group name to −90 degrees and add a consistent six-point gap between expanded channels and the name rail.
- Use an explicit icon-only X button on iOS, retaining the spoken Close label and a 44-point touch target.

## 0.16.1 — Connected group controls

- Give every expanded landscape member the same width with no gaps between channels. Place the rotated group name in a side rail at the start of the group, with a close icon above it.
- Open groups with a single tap on the title or digital display instead of a long press. Add a display chevron and open/close haptics that respect the device setting.

## 0.16.0 — Named groups, editing and scope

- Replace channel selection on the groups page with a list of existing groups. Open a group to edit it, create a new group with Save, or select multiple groups and delete them together.
- Rename groups, add/remove channels and change their order. Existing edits save automatically; new groups remain drafts until saved. Add native iOS reorder handles and Up/Down controls on Android/web, plus deletion inside the editor.
- Let groups apply to the current monitor mix or all AUXes on this device for this mixer. Share names, membership and order while keeping each AUX's live levels and remembered dB offsets separate. Prevent overlapping local/global membership.
- Migrate existing groups to stable IDs without changing their channel order or remembered balances. Keep names and IDs when members change, guard edits against mixer/AUX changes, and preserve all groups when applying a template.
- Wait for device storage before completing new-group saves and deletions; retain drafts and restore the layout on write failure.

## 0.15.1 — Full-height grouped faders and theme finishes

- Remove the landscape group header rail and its empty space on every other strip. Hold a collapsed group's name or LCD to expand it; keep Close beside the first member's display without reducing fader travel. Provide explicit screen-reader and keyboard activation.
- Remove the enclosing LCD-and-fader outline from ungrouped landscape strips. Keep one continuous frame around a group and its expanded members.
- Use the recessed graphite finish and grey/teal scale in dark mode in both orientations. Keep the red/beige finish in light mode, adding stronger directional shading, inset shadows and rim highlights for depth.

## 0.15.0 — Loading fader fly-out

- Zoom the abstract loading faders towards the viewer and fade them away when loading finishes. Mount ready screens beneath the exit immediately, keeping rendering and data work independent of the animation.
- Play the same exit when Done is pressed in the development loading preview, then return to settings. Ignore repeated presses during the exit.
- Use a short opacity-only exit with Reduce Motion, pause motion while backgrounded and cancel stale completions if loading restarts.

## 0.14.2 — Daylight surfaces and connected groups

- Give light mode a clean background, white settings surfaces and darker secondary labels. Use the landscape cream face, red outlines, scale markings and 0 dB pointers for portrait light-mode faders.
- Render expanded channel groups inside one continuous frame in both orientations. Landscape members replace the collapsed group strip inside that frame, with no empty group column or beside-the-group instructions.
- Move landscape group names and Open/Close controls into a shared header rail. Align every LCD and use the same fader travel for grouped and individual channels.
- Use a single native iOS scrolling form for channel-group selection, avoiding separately hosted controls overflowing their rows while scrolling. Keep long names wrapping and label the back button Mixer.

## 0.14.1 — Stable fader release

- Send drag levels in the same 0.1 dB steps shown on screen to avoid rounding changes when OSC floats return from the desk. Preserve group offsets and continuous pan values.
- Ignore up to two points of unsampled lift movement on release, while retaining larger final moves and explicit off/top endpoints. Subtract the gesture activation distance to avoid an initial handle jump.

## 0.14.0 — Animated fader loading

- Replace the icon and spinner on startup and mixer loading screens with three abstract faders moving independently. Use transform-only animations, pause in the background, and show static faders with Reduce Motion enabled.
- Remove the configured icon from the static native splash so new builds transition from a plain launch background into the animated app loader. Expo Go retains its own initial launch screen.
- Add Settings → Developer tools → Preview loading animation in development builds, with a Done button to return. The preview does not change connections or saved settings and is unavailable in production.

## 0.13.1 — Setup name AutoFill

- Mark the optional setup nickname field as a person's name so iOS and other supported keyboards can suggest a saved name for tap-to-fill. Capitalise words and disable spelling corrections for names.

## 0.13.0 — Landscape console strips

- Add illuminated LCD-style displays above landscape faders, showing each channel's name and current level (or pan in Pan mode), including grouped channels.
- Frame each landscape strip with red console-style outlines and a cream fader face with red scale markings. Position inward-pointing arrows at the actual 0 dB point.
- Widen landscape strips for readable displays and retain horizontal scrolling, safe-area spacing, handle-only gestures and per-channel live subscriptions.

## 0.12.2 — Immediate fader artwork

- Replace the oversized handle image with small 1×/2×/3× assets and preload them independently of device storage and desk requests.
- Draw a handle surface immediately while artwork decodes or if it fails. Keep handles fully visible while fresh values load; drag gating remains unchanged.
- Mount the channel bank as soon as channel metadata is available instead of waiting for the first level response.

## 0.12.1 — Development refresh recovery

- Remount the mixer provider during Fast Refresh so new UI code cannot reuse an older session/client instance missing methods such as canDrag. Close the previous connection and cancel pending writes before restoring device settings.

## 0.12.0 — Channel groups

- Create and remove device-local channel groups per server/AUX in Edit channels → Manage channel groups, or the mixer options menu.
- Show linked channels as one fader titled with their channel names. Open a group for individual adjustments and close it to control their relative dB balance.
- Use the loudest member as the group level; preserve offsets through all-off and lifting again. Individually off members stay off until raised individually. Fresh desk edits establish the next group balance.
- Keep pan individual, wait for fresh values from every member, and cancel pending group writes on navigation, AUX/mode changes and backgrounding. Preserve groups when applying shared layout templates.
- Save membership and remembered balances on the device; no server protocol change is required.

## 0.11.2 — Native web AUX selection

- Use the browser's native select for AUX selection in the web mixer, with the current mix selected and controls disabled while disconnected.

## 0.11.1 — Web connection input

- Keep the manual mixer address input above its decorative panel gradient so typed text and the placeholder remain visible in Expo web.

## 0.11.0 — Interaction feedback

- Briefly confirm successful template application, saved-level restoration and setting all sends to off, with a gentle entrance/exit and optional success haptic.
- Fade custom segmented selections and setup step content; keep native controls and fader touch response unchanged. Respect reduced motion and the haptic preference.
- Announce confirmations to screen readers, allow longer reading time, and clear notices on background/disconnect. Keep success notices separate from live channel subscriptions.

## 0.10.0 — Console details

- Carry graphite/silver console finishes into settings groups, with restrained teal section symbols and single inset surfaces. Keep native iOS forms and controls.
- Add a recessed icon surround and five small progress indicators to first-time setup; retain the flat nickname field and fixed bottom navigation.
- Use the same inset finish for the manual connection address and channel editor groups, without adding glass layers to buttons or sheets.

## 0.9.1 — AUX identity

- Add a discreet Monitor mix label above the selected AUX name in the portrait toolbar, or Demo mix when trying the app locally.
- Keep the heading within its share of toolbar space, retain nearby connected-user avatars and preserve the full-height landscape view.

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
