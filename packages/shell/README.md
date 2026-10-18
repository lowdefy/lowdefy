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

## Plugins, `_js`, locale and theme

- Pages run every actions-core action and the client operators of every default operator package
  (`src/plugins/types.js`). The actions whose web bodies reach the DOM run native bodies under the
  same names (`src/actions`): `SetFocus` focuses the control a block registered, `ScrollTo`
  scrolls the page's ScrollView to a block's measured place, `CopyToClipboard` uses
  `expo-clipboard`, and the local storage actions keep the app's keys in the device store, from
  which sign-out clears the user keys. `SetDarkMode` and `SetLocale` keep their actions-core
  bodies: they call the window members the theme provider and the shell's locale set.
- `_js` reaches the shell as module text: a page's `_jsEntries`, and the root's for the app
  events. `src/js/evaluateJsEntries.js` is the one place it becomes functions, with
  `new Function`.
- The app's locale is chosen as on the web: the `SetLocale` choice the device keeps, the device's
  locale the app supports, the app's default. Every dayjs locale is bundled
  (`src/locale/dayjsLocales.js`, written by `scripts/createDayjsLocales.mjs`) and loaded when
  used.
- One theme provider holds the theme mode for every screen, from the root's `theme` and the
  `SetDarkMode` choice; the root's `classMap`, with a dev page's own `_classMap`, styles classes.
- Menu icons are drawn from the icon data the root carries, with client-native's `Icon`, in the
  drawer menu. Native tab bars take images or SF Symbols, so tabs show titles only.
- Hermes has no `crypto.getRandomValues`, which `_uuid` needs; `expo-crypto` fills it.

## Checks

```bash
pnpm --filter=@lowdefy/shell test         # Jest, and the hello fixture build
pnpm --filter=@lowdefy/shell export:ios     # Metro and Hermes bundle, no simulator needed
pnpm --filter=@lowdefy/shell export:android
```
