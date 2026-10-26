{% raw %}
:::warning
**Mobile apps are experimental.** Turn them on with `config.experimental.mobile: true`. The `mobile` section, the native blocks and actions, the `lowdefy mobile` commands and the phone flags of `lowdefy dev` may change, or be removed, in a minor release. They have run on the iOS simulator; Android devices and real store submissions are still being tested.
:::

A Lowdefy app can run on iPhones and Android phones as a native app. The phone app is a **shell**, built from `@lowdefy/shell` (Expo and React Native), that opens one Lowdefy app. It uses the same YAML, server, requests, API endpoints and auth as the web app. Pages for phones are declared under `mobile` in `lowdefy.yaml` and render with native blocks, which have the same names, properties and events as the web blocks.

## Turn it on

```yaml
lowdefy: 7.1.0

config:
  experimental:
    mobile: true
  environments:
    production:
      url: https://app.example.com

mobile:
  menus:
    tabs:
      - pageId: today
        icon: CalendarDays
      - pageId: settings
        icon: Settings
  pages:
    - _ref: mobile/today.yaml
    - _ref: mobile/settings.yaml
  shells:
    - id: main
      name: Example
      icon: assets/icon.png
      version: '1.0'
      profile: basic
      ios:
        bundleId: com.example.app
      android:
        package: com.example.app
```

Without `config.experimental.mobile: true`, a `mobile` section, or `offline` on a request, fails the build:

```
Mobile apps are experimental. Set "config.experimental.mobile: true" in lowdefy.yaml to build the "mobile" section.
```

An app without a `mobile` section builds and runs exactly as before, with or without the flag.

## The mobile section

- `pages: object[]`: The pages a phone shows. A page can be phone-only, or the same `_ref` as a web page (a shared page), which is built once for both. A page on a phone may only use the types a shell carries; the build names any other.
- `menus: object`: How the phone navigates. `tabs` (2 to 5 items, each `pageId`, `icon` or `sfSymbol`, `title`), a `drawer`, or `stack: true` for a single stack of pages.
- `homePageId: string`: The page the app opens on. Defaults to the first menu item, or else the first mobile page.
- `minShellVersion: string`: The oldest shell version that may open the app. An older shell shows an "update the app" screen.
- `events: object`: App events (`onInit`, `onInitAsync`) that run on phones, in place of the root `events`. See [App events on phones](/events-and-actions).
- `shells: object[]`: The native apps built from this app. Each has an `id`, `name`, `icon`, store `version`, a capability `profile`, optional `extensions`, and `ios`, `android` and `eas` settings. See [`lowdefy mobile`](/cli#mobile).
- `auth: object`: Phone sign-in settings, such as how long a phone's session lasts.
- `notifications`, `share`, `widgets`, `shortcuts`, `background`: Push notification categories and the endpoints that register a phone, the page shared items open, Home Screen widgets, app icon shortcuts and background fetch.

## Capability profiles

A shell's `profile` fixes the native modules it carries, and so the permissions it asks for and what the store listing declares:

| Profile | Carries |
| --- | --- |
| `basic` | Native blocks, sign-in, biometric unlock, dictation, push and local notifications, haptics, share, Photos and Files pickers, read aloud, keep awake, icon shortcuts and background fetch. |
| `field` | `basic`, plus the camera (photos, codes, documents), location while in use, maps, voice notes and screen brightness. |
| `field-nfc` | `field`, plus reading and writing NFC tags. |
| `field-tracking` | `field`, plus location in the background and geofences. |

`extensions` add `share` (receive shared items), `widgets` (iOS widgets), `contacts` or `calendar` on top of a profile. A native action used on a shell that does not carry it fails with a message that names the profile it needs.

## Offline requests

A request with `offline: queue` is kept on the phone while it has no signal, and sent in order when the signal comes back. The action resolves `{ queued: true, id }`. The payload is evaluated once, when the request is queued. The web ignores `offline`. It also needs `config.experimental.mobile: true`.

```yaml
requests:
  - id: save_note
    type: MongoDBUpdateOne
    connectionId: jobs
    offline: queue
    payload:
      key:
        _uuid: true
```

## Sign-in

Phones hold ordinary sessions of the app's auth, sent as bearer tokens. The default sign-in is a native email-code screen. Passkeys, SSO and two-factor sign-in open in the system browser sheet and return to the app. Sign-out removes everything the phone cached for that person.

## Develop on a phone

- `lowdefy dev --ios` opens the app in Lowdefy Dev on an iPhone simulator (macOS with Xcode).
- `lowdefy dev --android` opens it on an Android emulator, or a phone connected by USB.
- `lowdefy dev --lan` lets a phone on the local network pair by QR code.

The [agent tools](/ai-agent-docs) take a `device` to screenshot, inspect and drive a phone. See [The CLI](/cli#dev).

## Build and release

`lowdefy mobile config | build | submit | update | release | checklist` builds, submits and updates shells with [EAS](https://expo.dev/eas), from your own Expo, Apple and Google accounts. `release` builds and submits when native code changed, and sends an over-the-air update when only JavaScript changed. See [`lowdefy mobile`](/cli#mobile).

## Not yet supported

- Android devices and real EAS store runs are not yet fully tested.
- Released builds of Lowdefy Dev. Until they ship, point `LOWDEFY_DEV_APP_IOS` or `LOWDEFY_DEV_APP_ANDROID` at a build.
- Offline reads (offline data), and Android widgets.
{% endraw %}
