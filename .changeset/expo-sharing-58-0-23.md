---
'@lowdefy/shell': patch
---

fix(deps): Update expo-sharing to 58.0.23 and keep files shared into the app

expo-sharing 58.0.23 stores each file shared into the app in a folder of its own, so two files with the same name no longer replace each other, and `clearSharedPayloads()` now deletes those files straight away. The shell cleared the payloads before the share page and `onShare` read the files, so it now copies each shared file into its own cache folder first and passes the copies on. The copies are deleted the next time the app opens. Text and link shares, and Lowdefy Dev's share injection, are unchanged.

expo-sharing is native code, so this rides on the same nativeVersion 6 bump as the Expo 58.0.23 update in this release.
