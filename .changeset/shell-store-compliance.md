---
'@lowdefy/shell': minor
---

feat(shell): Declare export compliance, a privacy manifest and the shell's icons in its app config

A shell build uploads to App Store Connect and Google Play without a person answering questions: the app config declares `usesNonExemptEncryption: false` and an iOS privacy manifest with the required-reason APIs of the shell's capability profile. `shell.json` takes `icon` (a 1024×1024 PNG beside it) and `color`, which set the app icon, the splash screen and the Android adaptive icon, whose foreground the shell writes from the icon, padded into the launcher's safe zone.
