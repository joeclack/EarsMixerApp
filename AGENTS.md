# Project preferences

- Bump the version with every change, fixes included: patch for a fix, minor for a feature. Update package.json, package-lock.json and CHANGELOG.md together, in the same branch as the change. Expo reads the version from package.json.
- Work on a feature branch and push completed changes. Merge into main only when the user asks.
- Implement changes, then hand them back to the user for testing. Do not run automated tests, typechecks or bundle builds unless the user requests them.
- Use native controls and their built-in materials; avoid layering custom glass over native glass.
