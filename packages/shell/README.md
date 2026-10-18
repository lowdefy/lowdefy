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
  "apps": [
    { "id": "field", "name": "Field", "urls": { "production": "https://field.example.com" } }
  ]
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

## Sign-in, unlock and sign-out

`src/auth`. The mobile root carries the app's `mobile.auth` (null for an app without auth, which
opens with no sign-in screen).

- With nobody signed in, the native email-code screen asks for an email, then the 6-digit code
  (iOS offers it from Mail). It always says "If this email can sign in, a code is on its way".
  "Other ways to sign in", `emailCode: false`, a server without email codes and a second factor
  open the app's sign-in page in an ephemeral system sheet (`/auth/mobile`, with a state and a
  PKCE S256 challenge); the shell checks the state and exchanges the one-time token with the code
  verifier at `/api/auth/one-time-token/verify`.
- The session token is kept in `expo-secure-store` on this device only: readable while unlocked,
  behind biometrics with `unlock: biometric`, or readable after first unlock for the
  `field-tracking` profile. It is read once per unlock and held in memory. Calls send no cookies.
- `unlock: biometric` shows a lock screen on launch and after `unlockAfter` seconds in the
  background, with "Sign in again" as the way out.
- Sign-out, the token cleared by the core (a Logout action, a 401), and a call with the token
  answered as the signed-out caller remove the token, every cached root and page of the app and
  the person's storage keys, then open the app afresh. A 403 drops that caller's cache.
  `sharedDevice: true` signs out whenever the app goes to the background.

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
- Block icons are drawn from the icon data each page carries (`_icons`), which `PageScreen` adds
  to the icon map client-native's `components.Icon` reads (`types.icons`).
- Menu icons are drawn from the icon data the root carries, with client-native's `Icon`, in the
  drawer menu. Native tab bars take images or SF Symbols, so tabs show titles only.
- Hermes has no `crypto.getRandomValues`, which `_uuid` needs; `expo-crypto` fills it.

## Lowdefy Dev

`src/dev`. Lowdefy Dev is this shell built as the `dev` variant: `LOWDEFY_SHELL_VARIANT=dev | release`
(`shellVariant.js`), `dev` by default for Lowdefy Dev (no `LOWDEFY_SHELL_CONFIG`) and `release` for
every other shell. A release bundle resolves `src/dev/index.js` to an empty module
(`metro.config.js`), so a customer shell carries none of it. A release shell also leaves Lowdefy
Dev's native modules unlinked (`getExcludedModules`): `expo-sensors`, `react-native-view-shot`, and
`expo-camera` unless the shell config's `capabilities` include `camera`. `app.config.ts` leaves out
their config plugins and permissions, and `withExcludedNativeModules.js` passes them as exclusions
to Expo autolinking in the generated Podfile and settings.gradle.

`pnpm check:release-bundle` checks a release shell (Lowdefy Dev's, or the one
`LOWDEFY_SHELL_CONFIG` names) on both platforms: its bundle holds neither the dev-tab client's
marker string nor a left-out module's native name, and an `expo prebuild` of it links none of the
left-out modules and asks for no camera (unless the shell needs it) or motion permission.
`--control` first checks that the `dev` variant holds and links them.

- **Connect.** `lowdefy-dev://connect?url=<server>&pair=<token>` (the QR code `lowdefy dev --lan`
  prints, or the link `--ios`/`--android` open), a scanned code (`expo-camera`), a typed address, or
  one of the last 5 servers. A server not on this device is confirmed first ("Connect to
  `<host>`?"); a simulator's or USB phone's localhost connects at once. Each server is its own app,
  with its own cache and session, and every call to it (fetch and websocket) carries its pairing
  token as `x-lowdefy-pair`.
- **Shake menu** (or `lowdefy-dev://menu`): reload, switch server, clear data, show logs, the block
  gallery, and the shell version.
- **Dev-tab client.** The open app joins the dev server's tab channel as a browser tab does: it
  registers on `/api/reload` (an event stream read from `expo/fetch`, or polls of
  `/api/reload?transport=poll` every second when the stream cannot be read), posts the page it shows
  to `/api/dev-inspect/page`, and answers on `/api/dev-inspect`:
  - `reload`: refetches the root and the page on screen and rebuilds the screens with empty page
    state, staying on the page.
  - `inspect-request`, `eval-request`: the browser tab's payloads (shared fixtures with the dev
    server's tests).
  - `step-request` `{ step }`: a journey step by block id (`click`, `fill`, `select`,
    `press: 'Enter'`, `wait`, `screenshot`), run through the engine; it waits for the action chain
    to settle. A screenshot is the root view as a base64 PNG (`react-native-view-shot`).
  - `inject` `{ inject: { kind, value, name } }`: fakes the next device result
    (`src/dev/inject`): `scan` `{ data, type }`, `photo` `{ base64, ... }` and `nfc` for the next
    read; `location` `{ latitude, longitude, ... }`, or a route as a list, read one at a time with
    the last one staying; `permission` with `name` and `'granted' | 'denied'`, standing until
    changed; `network` `'offline' | 'online'`, which fails the app's every fetch as offline (the tab
    client keeps its own); `clear`. `push` is refused until the shell carries expo-notifications.
    Device actions read these with `injected(name)` (`src/device/injected.js`), which returns
    nothing in a release shell; `GeolocationCurrentPosition` answers with an injected location.
- **Recorder** (`src/dev/recorder`). What the developer does is recorded as the web recorder records
  it: the engine trace's events paired with the presses and changes client-native reports by block
  id, a pageview when the page on screen changes, password inputs redacted, each record labelled
  `device: ios | android` and `shell_version`, posted to `/api/dev-recording`. `lowdefy journeys
session` lists and prints phone sessions as it does browser ones.

## Checks

```bash
pnpm --filter=@lowdefy/shell test         # Jest, and the hello fixture build
pnpm --filter=@lowdefy/shell export:ios     # Metro and Hermes bundle, no simulator needed
pnpm --filter=@lowdefy/shell export:android
pnpm --filter=@lowdefy/shell check:release-bundle   # no dev features or modules in a release shell
```
