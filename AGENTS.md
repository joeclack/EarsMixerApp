# EarsMixer app guidance

## Project preferences

- Do not change the version until the user says to. The user bumps it when a build goes to TestFlight. Until then, add each change to the CHANGELOG.md section for the current version. When asked to bump, update package.json, package-lock.json and CHANGELOG.md together. Expo reads the version from package.json.
- Work on a feature branch and push completed changes. Merge into main only when the user asks.
- Implement changes, then hand them back to the user for testing. Do not run automated tests, typechecks or bundle builds unless the user requests them.
- Use native controls and their built-in materials; avoid layering custom glass over native glass.

## Branches, commits and pull requests

- Base new work on `main` unless the task specifies another base or belongs on an existing feature branch. Use `<type>/<short-kebab-case-description>` for new branches. Common types are `feat`, `fix`, `refactor`, `docs`, `test` and `chore`.
- Keep commits focused. Review the staged diff and use `<type>(<scope>): <imperative summary>` for commits and PR titles. Omit the scope for changes that span the repository.
- Review the full diff against the target branch and use [the PR template](.github/pull_request_template.md), including when opening a PR through a CLI or API. Link the relevant issue and any companion PRs when they exist.
- Record validation commands and outcomes under **Checks**, and automated tests and manual scenarios under **Tests**. Explain anything skipped or blocked and mark CI pending while it runs. Include screenshots or recordings for visible changes and identify the platforms exercised.
- Update [PLAN.md](PLAN.md) in the same PR when completing a listed item. Split partially completed items and tick a section only once its readiness criteria are verified.
- When delivering work through a PR, push the feature branch, open or update the PR against its target branch and include the link in the handoff. Merge only when requested.

## Review

- Read surrounding code and affected callers. Check regressions, data loss, privacy, access boundaries, broken flows and gaps in coverage. Preserve existing test coverage and explain intentional expectation changes.
- Report actionable findings in severity order with the file, line, affected scenario and impact. State the checks run and any remaining verification. Use [SECURITY.md](SECURITY.md) for private vulnerability reporting.

## Expo and development

- Use Node.js 24 and npm. Read the Expo SDK major from `package.json` and consult the matching [Expo SDK reference](https://docs.expo.dev/versions/v58.0.0/) before changing Expo APIs. Use [the documentation index](https://docs.expo.dev/llms.txt) for related guides.
- Run `npx expo install <package>` for Expo or React Native dependencies. Use `npx expo start` for development and `npx expo-doctor` to diagnose configuration or dependency issues.
- Routes and layouts live in `app/`. Keep reusable UI, discovery and mixer logic in `src/` and the native discovery module in `modules/earsmixer-discovery/`.
- Configure generated native projects through `app.config.ts` and config plugins. Native discovery requires a development or release build. Use the profiles in `eas.json` and see [the README](README.md#builds-and-deployment).
- Use [the design system](DESIGN_SYSTEM.md). Keep connection and mixer rules testable outside screens. For affected flows, account for demo mode, reconnection and existing saved layouts and levels.
- When the user requests automated validation, use `npm run typecheck`, `npm test` and the relevant bundle script. Record which platforms still need user testing. For UI flows, prefer accessibility roles and labels where available.
