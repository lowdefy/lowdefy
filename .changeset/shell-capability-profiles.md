---
'@lowdefy/shell': minor
---

feat(shell): Capability profiles decide which native modules a shell links

`profiles.js` holds one table of the shell's capability profiles (`basic`, `field`, `field-nfc`, `field-tracking`, and `dev` and `development` for Lowdefy Dev and development builds): the native modules, config plugins, permissions, JavaScript entries, required-reason APIs and collected data each carries. A shell links only its profile's modules, applies only its plugins and blocks the permissions of the rest, so a `basic` shell carries no camera. A release shell never carries Lowdefy Dev's developer modules. A shell config without `profile` is `basic`, or `dev` for Lowdefy Dev. `expo-dev-client` is added for the `dev` and `development` profiles. `check:release-bundle` checks every release profile.
