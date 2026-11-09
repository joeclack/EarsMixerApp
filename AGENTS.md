# Project preferences

- Batch version changes: keep the current version while working through ongoing user feedback. Do not bump for each fix or feature commit. Bump once when the user requests a release/version update or a batch is explicitly being prepared for release: minor for a feature batch, patch for a fixes-only batch. Update package.json, package-lock.json and CHANGELOG.md together at that point. Expo reads the version from package.json.
- Work on a feature branch and push completed changes. Merge into main only when the user asks.
- Implement changes, then hand them back to the user for testing. Do not run automated tests, typechecks or bundle builds unless the user requests them.
- Use native controls and their built-in materials; avoid layering custom glass over native glass.
