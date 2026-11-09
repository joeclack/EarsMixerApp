# Project preferences

- Keep the app version in step with changes: minor bumps for new features, patch bumps for fixes; update package.json, package-lock.json and CHANGELOG.md together. Expo reads the version from package.json.
- Work on a feature branch and push completed changes. Merge into main only when the user asks.
- Implement changes, then hand them back to the user for testing. Do not run automated tests, typechecks or bundle builds unless the user requests them.
- Use native controls and their built-in materials; avoid layering custom glass over native glass.
