---
'@lowdefy/shell': patch
---

fix(shell): Every shell carries a photo library purpose text

`expo-image` links the Photos framework, so App Store Connect refused every shell upload without `NSPhotoLibraryUsageDescription` (ITMS-90683). The `basic` profile, and so every profile, now writes it. `nativeVersion` is 3.
