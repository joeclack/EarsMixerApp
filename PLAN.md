# EarsMixer app plan

Musicians connect to an EarsMixer server, choose their AUX and adjust what they hear in their monitors.

## Existing capabilities

- [x] Provide demo mode, manual server entry, QR scanning and native discovery.
- [x] Provide portrait and landscape mixing, channel groups, device-local layouts and server templates.

## Release checks

- [ ] Verify a fresh start and demo without a server, then connect to a test server through discovery, QR and manual entry.
- [ ] Verify PIN and nickname prompts, AUX choice, level, pan, mute, rotation and reconnection. Test supported older servers when changing the connection contract.
- [ ] Confirm saved setups, layouts and levels behave correctly after restarting the app, switching AUXes and upgrading from the prior build.
- [ ] Exercise iOS and Android release builds. Check phone and tablet layouts and the browser preview for affected shared flows. Record the devices and server version.
- [ ] When a store release is approved, verify the build metadata, listing and support links alongside the website.

**Ready when** the affected flows have verification on the intended release platforms and the release notes match the build.
