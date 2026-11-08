# Project preferences

- Keep the app version in step with changes: minor bumps for new features, patch bumps for fixes; update package.json, package-lock.json and CHANGELOG.md together. Expo reads the version from package.json.
- Work on a feature branch and push completed changes. Merge into main only when the user asks.
- Keep verification focused; avoid running broad test suites for small changes.
- Use native controls and their built-in materials; avoid layering custom glass over native glass.
