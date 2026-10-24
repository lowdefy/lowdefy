---
'lowdefy': patch
'@lowdefy/build': patch
---

fix(cli): `lowdefy mobile config` writes an `eas.json` that builds and submits without hand edits

Each build profile pins `pnpm` to the version that installed the shell project, so EAS no longer installs with its newest pnpm, which refuses packages published the same day. Each build profile sets its EAS `environment`: `production` for an environment named `prod` or `production`, `preview` for the rest. A shell's new `ios.ascAppId` (the App Store Connect app id) is written to every submit profile, so `submit --non-interactive` and `release --auto-submit` find the app. Environments without a `url` get no build or submit profile.
