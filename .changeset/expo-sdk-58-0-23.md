---
'@lowdefy/shell': patch
---

fix(deps): Update Expo to 58.0.23 and React Native to 0.88.1, with nativeVersion 6

The shell moves to `expo` 58.0.23, React Native 0.88.1 and the Expo SDK 58 module releases that go with it (`expo-router` 58.0.30, `expo-updates` 58.0.21, `expo-notifications` 58.1.8, `expo-location` 58.0.21, `expo-task-manager` 58.0.14, `expo-web-browser` 58.0.8, `@expo/ui` 58.0.28 and the other `expo-*` modules), `react-native-screens` 4.30.1, `react-native-safe-area-context` 5.11.1 and `react-native-nfc-manager` 4.2.0. They fix, among others, a startup crash on Android from a truncated over-the-air update asset, `fetch` and timers hanging in Android background tasks, background location stopping after an app update, auth sessions not opening the browser on Android when App Links cover the same domain, and the status bar ignoring style changes in apps built with the iOS 27 SDK.

The shell's native code changed, so its runtime version moves to nativeVersion 6. Every shell needs a new native build before it takes over-the-air updates from this release.
