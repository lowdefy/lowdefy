---
'@lowdefy/shell': minor
'@lowdefy/blocks-native': minor
'@lowdefy/build': minor
'@lowdefy/api': minor
'lowdefy': minor
---

feat(mobile): Share out from every shell, share in with the `share` extension

The `Share` action opens the share sheet with text, a link, a file on the phone, an https file the shell downloads first, or `base64` content with a `name` (a PDF made on the page). `mobile.shells[].extensions: [share]` adds expo-sharing's share extension: text, links, images, videos and files shared into the app open `mobile.share.pageId` with the payload in the `shared` query key and fire the `onShare` app event. Shell extensions are a new opt-in list (`share`, `widgets`, `contacts`, `calendar`) on top of the profile, written into shell.json by `lowdefy mobile config` and named in the runtime version.
