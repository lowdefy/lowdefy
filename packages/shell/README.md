# @lowdefy/shell

The Expo app every Lowdefy phone app is built from (Expo SDK 58, React Native 0.88, Hermes, New
Architecture). It carries code only: the Lowdefy engine, `@lowdefy/client-native` and the shell's
plugin maps. Pages, menus and theme come from the app's Lowdefy server as data. No `ios/` or
`android/` folder is committed: Expo writes them at build time.

## Config

`app.config.ts` reads `shell.json` from the path in `LOWDEFY_SHELL_CONFIG`, and falls back to
`shell.dev.json` (Lowdefy Dev):

```json
{
  "id": "field",
  "name": "Field",
  "profile": "standard",
  "scheme": "field",
  "environment": "production",
  "ios": { "bundleIdentifier": "com.example.field" },
  "android": { "package": "com.example.field" },
  "store": { "ios": "https://apps.apple.com/...", "android": "https://play.google.com/..." },
  "apps": [{ "id": "field", "name": "Field", "urls": { "production": "https://field.example.com" } }]
}
```

It adds the shell's `version` and its type manifest (`scripts/createTypeManifest.mjs`): every block,
action and operator type the shell registers (`src/plugins/types.js`, listed in
`src/plugins/shellPlugins.json`), with its plugin package and that package's major version.

## Boot, cache and sync

- One app opens at once; with several, a picker lists the one opened last first.
- The last root config and pages the app showed are read from SQLite and rendered at once. The
  cache is keyed by app, caller (person and organisation) and roles, from the server's
  `x-lowdefy-caller` stamp.
- In the background the shell fetches `GET /api/mobile/root` with `If-None-Match`, then every page
  whose index hash changed, 4 at a time. Dynamic pages, and dev pages (no hash), are fetched on
  each visit.
- Every call carries `x-lowdefy-shell` (the shell's version) and the session token as a bearer
  token, kept in the Keychain or Keystore.

## Version skew

- A page whose type set names a type the shell lacks, or carries at another major version, shows
  "Update the app to open this page" with the store link. Other pages still open.
- `mobile.minShellVersion` above the shell's version shows the same screen for every page.
- A page request refused with a 409 for another build syncs the root and changed pages, then is
  retried once when its own page did not change; otherwise the screen is rebuilt on the new page.
- A response answered as another caller drops the screens, syncs under the new caller's key and
  opens home.

## Navigation

Expo Router, with one route for every page, `app/(t0,t1,t2,t3,t4)/[...path].js`, in five route
groups: with `mobile.menus.tabs` each tab is a group with its own native stack, under native tabs.
A `drawer` frame is one stack with a menu button; a `stack` frame is one stack. A `Screen` page sets
its header title, `headerRight` and presentation. `Link` actions go through the router; a link to a
tab's page switches tab, and links to other sites open in the system browser.

## Checks

```bash
pnpm --filter=@lowdefy/shell test         # Jest, and the hello fixture build
pnpm --filter=@lowdefy/shell export:ios     # Metro and Hermes bundle, no simulator needed
pnpm --filter=@lowdefy/shell export:android
```
