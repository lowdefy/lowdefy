---
'@lowdefy/shell': minor
'@lowdefy/api': minor
'@lowdefy/blocks-native': minor
---

feat: `@lowdefy/shell`, the Expo app every Lowdefy phone app is built from

`@lowdefy/shell` is new: an Expo SDK 58 app (React Native 0.88, Hermes, New Architecture) that renders a Lowdefy app's mobile pages natively with `@lowdefy/client-native`. No `ios/` or `android/` folder is committed; Expo writes them at build time.

- `app.config.ts` reads the shell's `shell.json` from `LOWDEFY_SHELL_CONFIG` (shell id, profile, environment, store links and the one app it opens, with a url per environment), or `shell.dev.json` for Lowdefy Dev, and adds the shell's version and its type manifest: every type the shell carries, with its plugin package and major version.
- On start the shell renders the last root config and pages it showed from SQLite, cached per app, caller and roles, then syncs `GET /api/mobile/root` with `If-None-Match` and fetches every page whose hash changed, 4 at a time. Dynamic pages are fetched on each visit.
- A page needing a type the shell does not carry at the same major version shows "Update the app to open this page" with the store link, and the rest of the app works. `mobile.minShellVersion` above the shell's version shows that screen for every page.
- A page request refused for another server build syncs the root and changed pages and is retried once; a response from another caller drops the screens and opens home under that caller's cache.
- Navigation is Expo Router with one route for every page path: `mobile.menus.tabs` become native tabs with a stack each, `drawer` a stack with a menu button, and `stack` one stack. `Screen` pages set the header title, `headerRight` blocks and presentation. A `NoConnection` banner shows while the phone is offline.
- Calls carry `x-lowdefy-shell` and the session token as a bearer token, kept in the Keychain or Keystore.

`GET /api/mobile/root` now also carries the app's `lowdefyApp` (with its `buildId`), `lowdefyGlobal` and app `events`, as the web root config does.

`@lowdefy/blocks-native` lists the `Screen` page type, so the build accepts mobile pages of that type.
