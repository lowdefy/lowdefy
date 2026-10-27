---
'@lowdefy/shell': minor
---

feat(shell): Set the runtime version from the shell's nativeVersion

`@lowdefy/shell` declares a `nativeVersion` in its `package.json`, bumped only when its native code changes. A shell's runtime version is `<nativeVersion>-<profile>` (with a hash of its shell plugins when it has any), so every shell on one native version and profile takes the same over-the-air updates, whatever its name, ids or icon. `runtimeVersion.js` exports `getRuntimeVersion` for `lowdefy mobile`. `check:native-version` fails when the shell's native fingerprint changes without a bump. `shell.json` takes `version` (the store version) and `eas: { owner, projectId }`, which set the app config's `version`, `owner`, `updates.url` and `extra.eas.projectId`.
