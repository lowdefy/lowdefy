---
'@lowdefy/shell': patch
---

fix(deps): Update expo-sharing to 58.0.23 and keep files shared into the app, with nativeVersion 7

expo-sharing 58.0.23 stores each file shared into the app in a folder of its own, so two files with the same name no longer replace each other, and `clearSharedPayloads()` now deletes those files straight away. The shell cleared the payloads before the share page and `onShare` read the files, so it now copies each shared file into its own cache folder first and passes the copies on. The copies are deleted the next time the app opens. Text and link shares, and Lowdefy Dev's share injection, are unchanged.

The shell's native code changed, so its runtime version moves to nativeVersion 7. Every shell needs a new native build before it takes over-the-air updates from this release.
