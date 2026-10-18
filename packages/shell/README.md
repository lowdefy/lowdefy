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
  "profile": "field",
  "version": "1.4.2",
  "icon": "./icon.png",
  "color": "#0B5FFF",
  "scheme": "field",
  "environment": "production",
  "eas": { "owner": "example", "projectId": "2b6f…" },
  "ios": { "bundleIdentifier": "com.example.field" },
  "android": { "package": "com.example.field" },
  "store": { "ios": "https://apps.apple.com/...", "android": "https://play.google.com/..." },
  "app": { "id": "field", "name": "Field", "urls": { "production": "https://field.example.com" } }
}
```

A shell opens exactly one app, named by `app`. Every app's `_js` runs in the shell's one JavaScript
realm, which cannot be sandboxed, so a second app in the same shell could reach the first one's
session token, storage and cache. `checkShellConfig.js` refuses a `shell.json` that lists `apps`,
names more than one app, or has no url for the shell's `environment`; `app.config.ts` runs it, so
`expo prebuild` and `expo export` fail on such a config.

`profile` names the shell's capability profile, one row of the table in `profiles.js`: `basic`,
`field`, `field-nfc`, `field-tracking`, and `dev` and `development` for Lowdefy Dev and development
builds. Each lists the native modules, config plugins, permissions, JavaScript entry modules,
required-reason APIs and collected data it carries, and may extend another (`field` is `basic` and
the camera). `resolveProfile(name)` flattens one, and throws on a name the table lacks. A shell
config without `profile` is `basic`, or `dev` for Lowdefy Dev. `app.config.ts` applies only the
profile's config plugins, and sets `capabilities` from it when `shell.json` has none.

It adds the shell's package version and its type manifest (`scripts/createTypeManifest.mjs`): every block,
action and operator type the shell registers (`src/plugins/types.js`, listed in
`src/plugins/shellPlugins.json`), with its plugin package and that package's major version.

## Shell plugins

`plugins` in `shell.json` lists npm packages that add native code on top of the shell's profile:
`[{ name, version, typePrefix?, options? }]`, written by `lowdefy mobile config` from
`mobile.shells[].plugins`, which also installs them in the shell project. Each is a Lowdefy shell
plugin; `resolveShellPlugins.js` describes the package contract:

- `./shell` (CommonJS): a row shaped like one of `profiles.js` (`capabilities`, `modules`,
  `plugins`, `permissions`, `privacyReasons`, `dataCollected`). `plugins` may be a function of the
  plugin's `options`. `app.config.ts` loads it (`resolveShellPlugins.js`) and folds it into the
  resolved profile (`applyShellPlugins.js`), so its config plugins, permissions, privacy reasons and
  data join the profile's. Its modules are never excluded.
- `./native` (optional): named exports `blocks` and `actions`, `{ [typeName]: implementation }`.
  The shell ships `src/plugins/appTypes.js` empty; `config` rewrites it in the copy to import each
  plugin's `./native` with its `typePrefix` (`src/plugins/prefixTypes.js`), and `types.js`
  registers them after the built-in types.
- `./types` (optional): `native: { blocks, actions, blockMetas, icons }`.
  `scripts/createTypeManifest.mjs` adds `native.blocks` and `native.actions`, prefixed, to the type
  manifest with the plugin's major version, and fails when two packages give one type name.

`checkShellPlugins.js` refuses a plugin that links a module `@lowdefy/shell` carries itself
(`expo-camera`) or asks for a permission some profile carries and the shell's leaves out (the camera
on `basic`), naming the profile to pick. `config` runs it from the copied shell; `app.config.ts`
runs it again at prebuild. `fixtures/printer-plugin` is the test plugin.

## Store uploads

`app.config.ts` sets what App Store Connect and Google Play would otherwise ask a person on upload:

- `ios.config.usesNonExemptEncryption: false`: the shell uses only the OS's encryption.
- `ios.privacyManifests`: the required-reason APIs of the profile's modules (`privacyReasons` in
  `profiles.js`, where `basic` carries React Native's and expo-sqlite's), each listed once
  (`getPrivacyManifest.js`).
- From `shell.json` `icon` (a 1024×1024 PNG, relative to `shell.json`) and `color`: the app icon,
  the `expo-splash-screen` image on `color`, and the Android adaptive icon on `color`. Its
  foreground, the icon scaled into the centre 66% of a transparent canvas, is written beside
  `shell.json` as `adaptive-icon-<hash>.png` (`scripts/createShellAssets.mjs`) once per icon.
  Without `icon` (Lowdefy Dev) Expo's defaults stay.

## Versions

- `version` in `shell.json` is the store version (`major.minor.patch`), the app config's `version`.
  Lowdefy Dev has none and builds as `0.0.0`.
- `extra.shell.version` is the `@lowdefy/shell` package version, which the runtime sends as
  `x-lowdefy-shell`.
- `runtimeVersion` is `<nativeVersion>-<profile>`, with `-<hash>` of the shell's `plugins` when it
  lists any (`runtimeVersion.js`, a pure function `lowdefy mobile` reuses). Each plugin is keyed on
  `name@version` and its `options` as JSON with keys sorted, so a new plugin version or option is a
  new runtime version and a native build. An over-the-air update reaches only binaries with the same runtime version. Shell
  identity is not part of it, so every shell on one `nativeVersion` and profile shares it.
- `nativeVersion` in `package.json` is bumped only when the shell's native dependencies or config
  plugins change. `pnpm check:native-version` (run by the package's tests) computes Expo's
  fingerprint of the shell's native inputs for every profile and fails when it differs from the one
  `native-fingerprint.json` records for the current `nativeVersion`. After a bump,
  `pnpm check:native-version --write` records the new one.
- With `eas`, the app config sets `owner`, `updates.url` (`https://u.expo.dev/<projectId>`) and
  `extra.eas.projectId`.

## Boot, cache and sync

- The shell opens its one app at once. There is no app picker.
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
  open the app's sign-in page in an ephemeral system sheet (`/auth/mobile`, with a state, a PKCE
  S256 challenge and the platform). Once signed in, the page asks "Sign in to <app> on this
  device?"; Continue creates a new session for the phone and returns a one-time token for it. iOS
  returns to the shell's scheme; Android returns by the verified app link
  `<app url>/auth/mobile/callback`, which `app.config.ts` declares for each app url
  (`authCallbackIntentFilters.js`) and the app's `assetlinks.json` names the shell for. The shell
  checks the state and exchanges the one-time token with the code verifier at
  `/api/auth/one-time-token/verify`.
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
(`metro.config.js`), so a customer shell carries none of it. Every shell
leaves out the native modules its profile does not carry, and a release shell also leaves out
Lowdefy Dev's own (`expo-sensors`, `react-native-view-shot`, `expo-dev-client`) whatever its profile
(`getExclusions` in `shellVariant.js`): a `basic` shell links no `expo-camera`. `app.config.ts`
leaves out their config plugins and blocks their Android permissions, `withExcludedNativeModules.js`
passes them as exclusions to Expo autolinking in the generated Podfile and settings.gradle, and
`metro.config.js` resolves the left-out profiles' JavaScript entries to empty modules.

`pnpm check:release-bundle` checks a release shell (Lowdefy Dev's, or the one
`LOWDEFY_SHELL_CONFIG` names) on each release profile (`--profile` names one) and both platforms:
its bundle holds neither the dev-tab client's marker string nor a left-out module's native name,
and an `expo prebuild` of it links none of the left-out modules and asks for none of their
permissions. `--control` first checks that the `dev` variant holds and links them.

- **Connect.** `lowdefy-dev://connect?url=<server>&pair=<token>` (the QR code `lowdefy dev --lan`
  prints, or the link `--ios`/`--android` open), a scanned code (`expo-camera`), a typed address, or
  one of the last 5 servers. A server not on this device is confirmed first ("Connect to
  `<host>`?"); a simulator's or USB phone's localhost connects at once. Lowdefy Dev opens one dev
  server at a time; switching server closes the open app. Each server is its own app, with its own
  cache and session, and every call to it (fetch and websocket) carries its pairing
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
    client keeps its own) and takes the shell's online state offline (`src/host/networkStatus.js`,
    which expo-network also feeds), so the NoConnection banner shows and the app's `offline` events
    fire; `clear`. `push` is refused until the shell carries expo-notifications.
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
pnpm --filter=@lowdefy/shell check:release-bundle   # each release profile links only its modules
pnpm --filter=@lowdefy/shell check:native-version   # native code changed only with a nativeVersion bump
```
