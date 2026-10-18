---
'@lowdefy/cli': minor
---

feat(cli): Add the `lowdefy mobile` command group and `lowdefy mobile config`

`lowdefy mobile config --shell <id> --env <environment>` builds the app, then writes the shell's Expo project to `.lowdefy/mobile/<shell>/project`: a copy of the published `@lowdefy/shell` at the app's Lowdefy version, `shell.json` for the chosen environment, `eas.json` with a build and submit profile per environment and a `development` profile, and the icon. The folder is its own pnpm workspace with its own lockfile, so it installs the same way inside an app's pnpm monorepo. It prints the shell's runtime version. `--dry-run` writes the project but skips the install and prints it.

Every EAS call runs through one runner, `npx --yes eas-cli@<pinned version>` in the project folder with `EAS_NO_VCS=1`, passing `EXPO_TOKEN` and `SENTRY_AUTH_TOKEN` through from the environment. `build`, `submit`, `update`, `release` and `checklist` are listed and not available yet.
