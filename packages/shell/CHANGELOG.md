# @lowdefy/shell

## 7.2.0

### Minor Changes

- afeec0b: feat(server-dev): Agent tools take a device

  - `lowdefy_screenshot_page` and `lowdefy_run_journey` take `device`, a phone's tab id from the new `lowdefy_device list`. Steps (`click`, `fill`, `select`, `press`, `wait`, `screenshot` and `expect` with `state`) run on the phone in Lowdefy Dev by block id. A screenshot is taken with `xcrun simctl io` on a simulator, `adb exec-out screencap` on an Android device, or by Lowdefy Dev from its own view on a paired phone, and says which.
  - `lowdefy_inspect_state`, `lowdefy_snapshot_state` and `lowdefy_load_state` take `device` and read the phone's live state, or load a checkpoint into it.
  - New `lowdefy_device` tool: `list` the connected phones, booted simulators and Android devices; `start` Lowdefy Dev on a simulator or emulator, as `lowdefy dev --ios` or `--android` does; `inject` a phone's next scan, photo, NFC read, location, permission answer, push or network state. On an iOS simulator a location and permission are also set with `simctl`, and a push is delivered with `simctl push`.
  - `lowdefy_list_types` takes `target: web | mobile`; with `mobile` it lists the blocks, actions and client operators a native shell carries, which dev builds now write to `plugins/availableTypesMobile.json`.
  - Client errors in `lowdefy_build_status` carry `surface` (`web` or `mobile`, with the phone's shell version).
  - Lowdefy Dev names its platform and app id when it joins the dev server, and answers state checkpoint loads.
  - The simulator and emulator helpers of `lowdefy dev --ios` and `--android` move to `@lowdefy/node-utils`, shared with the dev server.

- c23d09a: feat(shell): Lowdefy Dev connects to `lowdefy dev`, has a shake menu, and joins the dev tab channel so agents can drive it

  - `LOWDEFY_SHELL_VARIANT=dev | release` decides whether a shell carries the developer features. Lowdefy Dev builds as `dev`, every other shell as `release`, whose bundle leaves them out. `pnpm --filter=@lowdefy/shell check:release-bundle` fails a release bundle that holds the dev-tab client.
  - Lowdefy Dev connects to a dev server from a `lowdefy-dev://connect` link, a scanned QR code, a typed address or one of the last 5 servers. It asks "Connect to `<host>`?" before attaching to a server off the device; a simulator's localhost connects at once. A paired server's token goes with every request and websocket.
  - Shake the phone (or open `lowdefy-dev://menu`) for reload, switch server, clear data, logs, the block gallery and the shell version.
  - The open app joins the dev server's tab channel as a browser tab does: it reloads with empty page state when the dev server rebuilds, answers state inspection and operator evaluation in a browser tab's shape, and runs journey steps (`click`, `fill`, `select`, `press`, `wait`, `screenshot`) by block id, waiting for each action chain to finish.
  - The dev server lets a phone paired with `lowdefy dev --lan` answer on `/api/dev-inspect` and post to `/api/dev-recording`; its other dev tools stay on this computer. A tab that cannot read an event stream can poll `/api/reload?transport=poll`.

- 29fd1a6: feat(shell): Lowdefy Dev fakes device results for agents and records what you do on the phone

  - The dev-tab client answers `inject` requests: the next scan, photo or NFC read, a location or a route of them, a permission answer, and network offline or online. While offline, every fetch the app makes fails as it does with no network. Push injection is refused until the shell carries `expo-notifications`.
  - Device actions read injections through one helper, `injected(name)`, which returns nothing in a release shell. `GeolocationCurrentPosition` answers on the phone with an injected location, or a denied permission, in the web action's shape.
  - Lowdefy Dev records clicks, changes, Enter presses and page views by block id in the web recorder's record shape, labelled with the device and shell version, so `lowdefy journeys session` lists and prints phone sessions. Password inputs are never recorded.
  - The engine trace gains `reportInteraction` and `subscribeInteractions`, and the native renderer reports block presses and changes through them. The recorder's record building moves to `@lowdefy/client-core`, shared by the web and phone recorders.
  - A release shell no longer links `expo-sensors`, `react-native-view-shot` or, unless its shell config's `capabilities` include `camera`, `expo-camera`, and asks for none of their permissions. `check:release-bundle` runs `expo prebuild` and fails a release shell that still links them or asks for the camera it does not need.

- f05943c: feat(shell): Native actions, `_js`, i18n and icons in the phone shell

  Phone pages now run the same actions and operators as the web. `SetFocus`, `ScrollTo`, `CopyToClipboard` and the local storage actions have native bodies under the same names: focus goes to the control a block registers, `ScrollTo` scrolls the page to a block's measured place, the clipboard is the phone's, and local storage values live in the device store under the app's keys. `SetDarkMode` and `SetLocale` work as on the web. The shell registers the client operators of every default operator package (`_dayjs`, `_nunjucks`, `_mql`, `_jsonata`, `_uuid` and the rest).

  `_js` on mobile pages and in app events runs on the phone: the build gives the app events' client `_js` to the mobile root as module text, as it does for mobile pages. The mobile root also carries the app's `i18n`, and the shell picks the locale as the web does, with dayjs locale data for every locale. Menu icons are drawn from the root's icon data with client-native's new `Icon`, which draws the web's icon data with `react-native-svg`. The shell now passes the root's `theme` and `classMap` to client-native, so classes and the theme mode style blocks on the phone.

- 083821c: feat: Mobile pages carry the icon data of the icons they draw

  Each built mobile or shared page now carries `_icons`, the icon data of the icons its blocks draw, resolved as web pages' icons are (semantic names, aliases and plugin sets such as `tabler:`), in the full build and in dev page builds. The shell adds a page's `_icons` to the icon map the native `Icon` renderer reads, so block icons draw on the phone. Web pages are unchanged.

- d80e12d: feat: The phone sign-in sheet asks to confirm, gives the phone its own session and returns by app link on Android

  - `/auth/mobile` no longer hands a session to a shell on a GET. A signed-in person sees "Sign in to <app> on this device?", naming the shell and the account, with Continue and Cancel. The one-time token is minted only when the page posts back from the app's own origin with its CSRF token. Cancel returns `error=cancelled` to the shell.
  - Continue creates a new session for the phone, with the browser session's active organization and the phone lifetime from `mobile.auth.sessionExpiresIn`. The browser's own session is never handed over, marked or extended, so signing out on the phone leaves the browser signed in. A browser session created inside this sign-in is ended once the phone has its own.
  - Shells send `platform=ios` or `platform=android` (now required). Android returns by the https app link `<app url>/auth/mobile/callback`, verified through `assetlinks.json`, instead of the shell's scheme, so no other app can receive the token. An Android shell needs `android.package` and `android.sha256` in `mobile.shells`. If the link is not verified, `/auth/mobile/callback` asks the person to return to the app and never shows the token. iOS keeps the shell's scheme.
  - The shell declares the app link in its Android manifest for each app's https url.

- 9aa9608: feat: `@lowdefy/shell`, the Expo app every Lowdefy phone app is built from

  `@lowdefy/shell` is new: an Expo SDK 58 app (React Native 0.88, Hermes, New Architecture) that renders a Lowdefy app's mobile pages natively with `@lowdefy/client-native`. No `ios/` or `android/` folder is committed; Expo writes them at build time.

  - `app.config.ts` reads the shell's `shell.json` from `LOWDEFY_SHELL_CONFIG` (shell id, profile, environment, store links and the one app it opens, with a url per environment), or `shell.dev.json` for Lowdefy Dev. The shell's version and its type manifest, every type it carries with its plugin package and major version, are bundled with its JavaScript.
  - On start the shell renders the last root config and pages it showed from SQLite, cached per app, caller and roles, then syncs `GET /api/mobile/root` with `If-None-Match` and fetches every page whose hash changed, 4 at a time. Dynamic pages are fetched on each visit.
  - A page needing a type the shell does not carry at the same major version shows "Update the app to open this page" with the store link, and the rest of the app works. `mobile.minShellVersion` above the shell's version shows that screen for every page.
  - A page request refused for another server build syncs the root and changed pages and is retried once; a response from another caller drops the screens and opens home under that caller's cache.
  - Navigation is Expo Router with one route for every page path: `mobile.menus.tabs` become native tabs with a stack each, `drawer` a stack with a menu button, and `stack` one stack. `Screen` pages set the header title, `headerRight` blocks and presentation. A `NoConnection` banner shows while the phone is offline.
  - Calls carry `x-lowdefy-shell` and the session token as a bearer token, kept in the Keychain or Keystore.

  `GET /api/mobile/root` now also carries the app's `lowdefyApp` (with its `buildId`), `lowdefyGlobal` and app `events`, as the web root config does.

  `@lowdefy/blocks-native` lists the `Screen` page type, so the build accepts mobile pages of that type.

- b54d521: feat(shell): Sign in on the phone by email code or the system sheet, with biometric unlock and sign-out

  - An app with auth opens on a native sign-in screen: the person types their email, then the 6-digit code from the email, which iOS offers to fill in. The screen always says "If this email can sign in, a code is on its way", whether or not the address can. Resend waits 30 seconds.
  - "Other ways to sign in", `mobile.auth.emailCode: false` and a person with a second factor go to the app's own sign-in page in an ephemeral system sheet. The shell sends a random state and a PKCE challenge, checks the state on the way back and exchanges the one-time token with the code verifier, which never leaves memory.
  - The session token is kept in the Keychain or Keystore on this device only, behind Face ID or a fingerprint with `mobile.auth.unlock: biometric`, or readable after the first unlock for shells with background location work. It is read once per unlock. The shell sends no cookies.
  - With `unlock: biometric`, a lock screen shows on launch and after `unlockAfter` seconds in the background, with "Sign in again" as the way out.
  - Signing out, a Logout action, or the server refusing the session (a 401, or an answer as the signed-out caller) removes the token, every cached page of the app and the person's storage keys, and opens the app afresh. A 403 drops that organisation's cache. `mobile.auth.sharedDevice: true` signs out whenever the app is closed.
  - The mobile root now carries `auth`: the app's `mobile.auth` settings a shell signs in and locks by, or null for an app without auth.

- dd5c2b1: feat: A native `AgentChat` block, so an app's agent works on the phone as it does on the web

  - `AgentChat` in `@lowdefy/blocks-native` talks to the same `/api/agent` route as the web block, through `@ai-sdk/react`'s `useChat`, with the web block's properties, events and methods where a phone can honour them. Replies stream in as markdown, reasoning sits behind a disclosure, tool calls are compact rows that open to their output, approvals have Reject and Approve, a failed reply has Try again, and a long press copies or regenerates. The composer sits in the Screen's footer above the keyboard, with stop while a reply streams, a new-chat button and the welcome prompts as chips. `update-page-state` writes into the page state, as on the web.
  - `threads: { module: ai-assistant, scope }` keeps the conversations through the ai-assistant module's endpoints: the chat resumes the thread last opened, saves and names each one, and the `openThreads` method opens a sheet of recent chats where a row opens one and a swipe deletes it. `threads.endpoints` names an app's own endpoints of the same shape.
  - Attachments are not on mobile yet: the `basic` shell profile has no file or image picker.
  - Native blocks get `methods.streamFetch`, a server call whose answer streams (the shell's `expo/fetch`, with the bearer session and the shell header), and `useScreenFooter` from `@lowdefy/client-native` draws a block's own chrome in the page footer. A Screen with no footer slot now leaves the footer alone.

- 2ce6fa5: feat(shell): Links to the app's site open in the shell

  A shell now declares the Associated Domains entitlement (`applinks:<host>`) and an Android App Links filter for its app's https url, beside the sign-in callback, so a link to one of the app's pages in an email or a chat opens the page in the app. The server already names the shell in `apple-app-site-association` and `assetlinks.json`.

- 2ce6fa5: feat(mobile): Voice notes, read aloud, keep awake, brightness, contacts and calendar

  Every shell reads text aloud (`Speak`, `StopSpeaking`) and keeps the screen on (`KeepAwake`). `field` records voice notes (`StartRecording`, `StopRecording`, with `upload`) and sets the screen brightness for scan screens (`SetBrightness`, given back to the system when the app goes to the background); its microphone purpose text covers recording. The `contacts` extension adds `PickContact` and `AddContact`, and the `calendar` extension `AddCalendarEvent` and `GetCalendarEvents`.

- 2f7a526: feat(blocks-native): Box swipe events and a PageDots block

  - `Box` takes `onSwipeLeft` and `onSwipeRight` on mobile. Its PanResponder takes only clear horizontal swipes (across more than 40pt and more than twice as far across as down, or a fast flick) in a direction the Box has an event for, so vertical scrolls go on, and leaves drags that start within 20pt of the screen's left edge to the iOS back gesture. `swipeFeedback: true` moves the Box a little with the drag on a rubber band and springs it back. Screen readers get the swipes as accessibility actions.
  - `PageDots` is a mobile-only display block, iOS's page control: `count` dots in `color` with the `index` dot in full colour, which slides to its place on a spring when the index changes. For a record's place among recents.

- bd50d64: feat(blocks-native): ChipSelector block and the Screen `headerBottom` slot

  - `ChipSelector` is a mobile-only input (`valueType: string`): a horizontally scrolling strip of 32pt chips, such as a space switcher. Options take `value`, `label`, an `icon` drawn in a 20pt rounded-square tile of the option's `color`, and a `badge`. `color` is a palette hue, token or hex colour (a tile with a white icon), or `{ fg, bg, fgDark, bgDark }`, a mark drawn fg on bg with its dark mode variants. The selected chip fills with a soft tint of its own colour, with a border and label of the colour. Chips scale as they are pressed, the strip fades at its edges and keeps the selected chip in view, and an optional `moreChip: { label, icon }` fires `onMore`. Picking a chip fires `onChange` with `{ value }`.
  - `Screen` takes a `headerBottom` slot: blocks pinned directly under the header (under the large title or the search field), such as a ChipSelector and a SegmentedControl. They ride with the content as a large title collapses or the page is pulled to refresh, then stay under the header, on the screen's background with a hairline, as the page scrolls. Blocks in it sit at the 16pt screen inset; a ChipSelector runs edge to edge.
  - `LowdefyPage` takes `headerInset`, where the header's bottom edge is in the page's scroll view; the shell passes the native stack's animated header height when the page scrolls under the bar, and hides the bar's own hairline for a page with a headerBottom.
  - `@lowdefy/client-native` exports `EdgeInsetContext`, an area's horizontal padding that an edge-to-edge block cancels.

- 8736703: feat(blocks-native): Native SegmentedControl, Sheet and Menu blocks, and Selector `variant: menu`

  `@lowdefy/blocks-native` now draws the platform's own controls through `@expo/ui`, which the `basic` shell profile already links, so no native rebuild is needed.

  - `SegmentedControl` is an input: a SwiftUI segmented picker on iOS and Material segmented buttons on Android. It takes `options` as a Selector does, fills its container's width, and fires `onChange` with `{ value }`.
  - `Sheet` is a container presented as a native sheet: a SwiftUI sheet with medium and large detents on iOS and a Material modal bottom sheet on Android. It takes `title`, `detents` (`both`, `medium` or `large`), `dragToDismiss` and `closable`, a `content` slot and a `headerRight` slot. Its `open` and `close` methods are called with CallMethod, and it fires `onOpen` and `onClose`.
  - `Menu` opens a native menu (a SwiftUI Menu, or a ContextMenu with `openOn: longPress`) from its `content` slot blocks or from an icon and title. Items take `id`, `title`, an SF Symbol `symbol`, `checked`, `destructive`, `disabled` and `hidden`; an item with `items` is a section, or a nested menu with `submenu: true`. Picking one fires `onSelect` with `{ id }`.
  - Selector takes `variant: menu`: an iOS Settings-style row, the title at the left and the chosen option at the right with an up-down chevron, that opens a native menu of the options with the chosen one checked. Options can carry a `symbol`, an `icon` and `iconColor`, or an `avatar` drawn as initials.

- 61ae799: feat: Dictation in the native Composer and AgentChat inputs

  - The native Composer and AgentChat inputs have a microphone button. It runs on-device dictation through `expo-speech-recognition`, shows a listening row with the partial transcript, and asks for microphone access with a warning and a Settings link when it is off. A spoken "for Sam, ..." in a Composer turns into a mention as typed text does.
  - The shell carries `expo-speech-recognition` 58.0.0 in the basic profile, with the microphone and speech recognition usage strings. The shell's `nativeVersion` is now 2, so this needs a new native build.
  - In Lowdefy Dev, `lowdefy_device` action `inject` takes kind `transcript` (`{ partials, final }` or `{ error }`) for what the next dictation session hears. With no injected transcript, Lowdefy Dev uses the phone's microphone.
  - Development builds hide the dev menu's floating tools button.

- 2ce6fa5: feat(mobile): NFC, background location, geofences, location, maps and signatures

  `field` reads the phone's location for `GeolocationCurrentPosition` and draws the new `Map` block (Apple Maps on iOS, Google Maps on Android, with `LOWDEFY_GOOGLE_MAPS_API_KEY` at build time). `field-nfc` adds `ReadNfc` and `WriteNfc` for NDEF text and URI records. `field-tracking` adds `StartLocationTracking`, `StopLocationTracking`, `StartGeofencing` and `StopGeofencing`: points and region enter and exit post to API endpoints with the app closed, posts that fail wait for the next wake, and `onGeofence` fires while the app is open. The `SignaturePad` block draws a signature with a finger; its value is `{ svg, strokes, width, height }`, and every shell has it.

- 54f0579: feat(blocks-native): Add an Illustration block, an animated vector drawing

  - `Illustration` draws SVG markup with keyframe animations of its elements by id: `translateX`, `translateY`, `rotate`, `scale`, `scaleX`, `scaleY` and `opacity`, with `duration`, `delay`, `loop`, `origin` and an easing per animation or keyframe (`linear`, `ease`, `easeIn`, `easeOut`, `easeInOut`, or `step` for frames that swap, as pixel art does). Each animated element is drawn in a view of its own, so the animations run on React Native's native driver. It adds no native module.
  - Colours are `var(--name)` references to `colors`, with `colorsDark` over them in dark mode; theme tokens work too (`var(--colorLabel)`).
  - `position` (`{ top, right, bottom, left }`) draws the box at those offsets from the block's place without taking room, such as a Screen's first block reaching up beside the large title, where it scrolls away with the title. It never takes touches, holds still with Reduce Motion on, and is hidden from screen readers unless it has a `title`.

- 64159ca: feat(blocks-native): iOS semantic theme, dark mode and native block polish

  - The native theme tokens carry the iOS semantic colours for each mode: `colorGroupedBackground`, `colorCell`, `colorCellNested`, `colorCellPressed`, `colorSystemBackground`, `colorSeparator`, `colorOpaqueSeparator`, `colorLabel`, `colorSecondaryLabel`, `colorTertiaryLabel`, `colorQuaternaryLabel`, `colorSystemFill` to `colorQuaternarySystemFill`, `colorTint` (the mode's `colorPrimary`) and `colorTintFill`. An app sets any of them per mode in `theme.antd.token`, `lightToken` or `darkToken`, and `_theme` reads them.
  - Dark mode works end to end: pages draw on the grouped background, the shell's navigators take a theme built from the tokens (in place of React Navigation's light grey default), the status bar follows the mode, and the app window takes a mode fixed by config or SetDarkMode so native bars and controls match.
  - Text follows the iOS text styles in the system font. Title levels 1 to 5 are largeTitle, title1, title2, title3 and headline, and Title and Paragraph take `textStyle`.
  - An input without a title shows no label, in place of its block id.
  - `TextInput` takes `variant: search`, the iOS search field. `TextArea` takes `variant: composer`, which grows from one line to six and shows a send button that fires the new `onSend` event and clears the field when its actions succeed.
  - `Tag` is a pill with `size` (small or default) and a leading `dot`. `Empty` is a ContentUnavailableView with `icon`, `title` and `description`. `Skeleton` shimmers and draws loading list rows with `count`, `rows` and `avatar`. `Button` takes the iOS styles (`solid` as filled, and `tinted`, `gray` and `plain`), iOS sizes and `iconPlacement`, and shows an icon alone when it has no title. `Alert` is an iOS callout, and `Card` an iOS grouped cell.

- a7bca54: feat(blocks-native): Native List, ListItem, TextInput, TextArea, NumberInput, Selector, Switch, DateSelector and Button

  `@lowdefy/blocks-native` now has components, exported from `./blocks`, for the first list, input and action blocks. They keep the web blocks' names, properties, events, methods and value types, so a page shared with the web works on a phone; web properties a phone cannot honour are accepted and described as ignored on mobile.

  - `TextInput`, `TextArea` and `NumberInput` use React Native's text input with the keyboard each input needs (email, phone, URL, number or decimal pad, hidden password entry). `NumberInput` keeps its value within `min` and `max` and rounds to `precision` when it loses focus, and shows step buttons with `mode: spinner`.
  - `Selector`, `Switch` and `DateSelector` use `@expo/ui`'s native picker, switch and date picker, now a dependency of the shell. `Selector` options may hold any value, as on the web, and `appearance: wheel` shows the iOS scroll wheel. `DateSelector` sets the picked day at midnight UTC, as on the web, and takes `disabledDates.min` and `max`.
  - Every input has the web label: title, `required` mark, colon when inline, extra text, and the validation message once `Validate` shows it.
  - `List` keeps the web model (an array in state, its `content` slot per item, and `pushItem`, `unshiftItem`, `removeItem`, `moveItemUp` and `moveItemDown`) and renders with a virtualised list. Phone-only: `swipeActions` (buttons a swiped item shows, each firing the event it names with the item index), `sectionKey` (sticky section headers) and the `onRefresh` event (pull to refresh, for a List with `scroll: true`).
  - `ListItem` is new: a list cell with a title, description, avatar or icon, a detail on the right and a chevron, and `onClick`.
  - `Button` follows `color`, `variant`, `danger`, `ghost`, `size`, `shape`, `block` and the deprecated `type`, and shows a spinner while its `onClick` runs.
  - Blocks draw with the app's theme tokens in light and dark mode, with a block's own `theme` overrides over them, under its classes and style.

- 78e54ea: feat(blocks-native): iOS lists and rows, and the Avatar and StatusIcon blocks

  - `List` takes `variant`: `insetGrouped` (the default) draws each section as a rounded group of cells, inset 16pt on the grouped background, with separators inset to the row text; `plain` draws edge to edge rows with sticky section headers. Sections come from `header` (one section) or `sectionKey` with `sections` (`[{ key, title, count, status, footer }]`, in that order, empty ones hidden). `showCount` counts each section's items, and `headerVariant` picks Footnote upper case or Headline headers.
  - `ListItem` takes `leading` (a status glyph, avatar or icon) and `trailing` (text, badges, a glyph, an icon or avatars) properties and slots, a `subtitle`, `titleLines`, an iOS press highlight, `swipeActions` (`leading` and `trailing` buttons with a full swipe, firing `onSwipeAction` with the id) and `contextMenu` (iOS's native long-press menu, firing `onContextMenu` with the id). It becomes a container block for its slots.
  - `Avatar` draws a person's initials on a colour picked from their name, or their image, and stacks several with `avatars`.
  - `StatusIcon` draws Linear-style status, priority and stage glyphs by name, coloured for light and dark mode.

- 2ce6fa5: feat(mobile): Offline request queue for `offline: queue` requests

  A request with `offline: queue` is kept by a mobile shell while it has no signal, or when the send fails for the network, and sent in order when the signal returns or the app starts. The action resolves with `{ queued: true, id }`. The payload is evaluated once, when the action runs, and sent unchanged, so a `_uuid` in the payload is a stable idempotency key. A 2xx removes the request; any other server answer marks it failed with the server's message until `RetryRequestQueue` or `DiscardQueuedRequest`. The `onRequestQueue` app event and `GetRequestQueue` report `{ pending, failed, items }`. Sign-out clears the queue. On the web the key is ignored. The engine passes the request's `offline` to the core's `callRequest`, which sends it through a host's `requestQueue` when the host has one.

- 2ce6fa5: feat(mobile): Haptics, file input, photo and file pickers, code and document scanning

  `Haptic` plays a selection tick, an impact or a notification haptic, and Switch, Selector, MultipleSelector, ChipSelector, SegmentedControl and full swipe actions give light feedback. Every shell picks photos and videos from Photos (`PickImage`) and files from Files (`PickFile`) with the system pickers, which need no permission, and the new `FileInput` block holds the picked files with thumbnails and a remove button. Shells on `field` add `TakePhoto`, `ScanCode` (a full-screen camera that returns the first QR code or barcode), the native `QRScanner` block, and `ScanDocument` (VisionKit and ML Kit edge detection and crop, pages as JPEG files). Every picker takes `upload: { endpointId, payload }` to send each file to an API endpoint.

- 2ce6fa5: feat(mobile): Push and actionable notifications in every shell

  Every shell carries expo-notifications. `mobile.notifications` names the API endpoints the shell posts its push token to once signed in (`register`, with `{ token, expoToken, platform, provider, shellId, appVersion }`) and at sign-out (`unregister`), how a notification shows while the app is open (`foreground: banner | silent`), and categories of action buttons. A tap opens `data.path` and fires the `onNotificationAction` app event; a button with `endpointId` (Approve, or Reply with `input`) calls the endpoint without opening the app; `snooze: <minutes>` shows the notification again later. `onNotification` fires for a notification received while the app is open, and a push with `data.refreshWidgets` refreshes the widgets. New actions: `ScheduleNotification`, `CancelNotification`, `SetBadgeCount` and `RequestNotificationPermission`. `lowdefy_device inject` with kind `push` now shows the notification in Lowdefy Dev and can tap it or press a button; an APNs payload with `aps` still goes through `simctl push` on an iOS simulator.

- 2fd3b01: feat(client-native): Screen `backgroundTint`

  - `Screen` takes `backgroundTint: { color, colorDark, height }`: a vertical gradient from the colour at the top of the screen (35% in light mode, 45% in dark mode) easing out to clear at `height` of the screen height (default 0.15). It is drawn with react-native-svg as the page scroll view's first content, behind the blocks and fixed to the screen's top, so it shows behind the large title, through the translucent navigation bar and behind the content. `colorDark` is used in dark mode; a colour may be a CSS colour, a theme token or a palette hue. A change of tint cross-fades over 250ms.
  - A pinned `headerBottom` draws the tint in its surface too, where the page draws it, so the strip continues the gradient rather than painting a band of the grouped background over it.
  - The shell makes the iOS navigation bar clear over a Screen with a `backgroundTint` (`headerTransparent`; before iOS 26 also clear at the scroll edge, with the chrome material once content scrolls under it), so the tint shows behind it.

- bb7c249: feat(client-native): iOS Screen headers, tab bar icons and per-screen page state

  - `Screen` takes `largeTitle` (an iOS large title that collapses as the page scrolls), `headerSearch` (a native search bar with `placeholder`, `autoFocus`, `debounce` and `hideWhenScrolling`, firing `onSearch` and `onSearchChange` with `_event: value`) and `headerActions` (`[{ id, icon, sfSymbol, title, placement, event, disabled }]`, compact icon buttons that iOS draws as native SF Symbol bar buttons, firing `onHeaderAction` with `_event: id` or their own `event`).
  - `Screen` events `onRefresh` (pull-to-refresh, refreshing until the actions finish) and `onFocus` (each time the screen is shown: first show after onMount, a tab switch, back navigation).
  - The `headerLeft` and `headerRight` slots draw their blocks at their natural size, so a header button is no longer a full-width capsule that truncates the title.
  - Two screens of one page in a stack keep their own page state, keyed by route instance, and each reads `_url_query` and `_location` from its own route, not the focused one. A tab's page opened by a link keeps its query.
  - `mobile.menus.tabs` items draw their icon in the native tab bar: an SF Symbol on iOS (`sfSymbol`, or the symbol mapped from the Lucide or semantic icon name), the Lucide icon elsewhere, the selected tab in the theme's primary colour. `role: search` makes an item iOS 26's search tab.
  - The engine's `getContext` takes an `instanceId` and the screen's own `globals`.

- 2ce6fa5: feat(mobile): Share out from every shell, share in with the `share` extension

  The `Share` action opens the share sheet with text, a link, a file on the phone, an https file the shell downloads first, or `base64` content with a `name` (a PDF made on the page). `mobile.shells[].extensions: [share]` adds expo-sharing's share extension: text, links, images, videos and files shared into the app open `mobile.share.pageId` with the payload in the `shared` query key and fire the `onShare` app event. Shell extensions are a new opt-in list (`share`, `widgets`, `contacts`, `calendar`) on top of the profile, written into shell.json by `lowdefy mobile config` and named in the runtime version.

- 2ce6fa5: feat(shell): Native version 3

  The shell's native modules for the native capabilities land under one `nativeVersion` bump (2 to 3): expo-notifications, expo-haptics, expo-sharing, expo-document-picker, expo-image-picker, expo-speech, expo-keep-awake, expo-background-task, expo-task-manager and expo-quick-actions in `basic`; expo-location, expo-maps, expo-audio, expo-brightness and react-native-document-scanner-plugin in `field`; react-native-nfc-manager in `field-nfc`; expo-widgets, expo-contacts and expo-calendar as extensions. Every shell needs a new native build; a 2.x binary takes no over-the-air update of this version.

- 2ce6fa5: feat(mobile): Widgets, quick actions, App Shortcuts and background fetch

  `mobile.widgets` lists widget sources (`{ id, title, layout: count | list, endpointId, path }`) for shells with the `widgets` extension: iOS Home Screen and Lock Screen widgets in two fixed layouts, the source picked when the widget is added, refreshed from the endpoints at launch, on resume, on a push with `data.refreshWidgets`, on background fetch and on `RefreshWidgets`. `mobile.shortcuts` (up to 4) become the app icon's quick actions on iOS and Android and the options of one App Shortcuts intent ("Open <shortcut> in <app>") for Siri and Spotlight; choosing one opens its path and fires `onShortcut`. `mobile.background: { endpointId, interval }` runs background fetch while the app is closed: the endpoint's `{ badge, refreshWidgets }` is applied, the offline queue is sent and the cached pages refresh. The build checks every endpoint and page these name.

- 9fc19a0: feat(shell): Capability profiles decide which native modules a shell links

  `profiles.js` holds one table of the shell's capability profiles (`basic`, `field`, `field-nfc`, `field-tracking`, and `dev` and `development` for Lowdefy Dev and development builds): the native modules, config plugins, permissions, JavaScript entries, required-reason APIs and collected data each carries. A shell links only its profile's modules, applies only its plugins and blocks the permissions of the rest, so a `basic` shell carries no camera. A release shell never carries Lowdefy Dev's developer modules. A shell config without `profile` is `basic`, or `dev` for Lowdefy Dev. `expo-dev-client` is added for the `dev` and `development` profiles. `check:release-bundle` checks every release profile.

- 301e6f3: feat(shell): Render pages with the whole native block set

  The shell now registers every block of `@lowdefy/blocks-native` (the layout, display, list, input and action blocks), with the `Screen` page type from `@lowdefy/client-native`, and its type manifest lists them all, so mobile pages that use them pass the shell's type check. The shell's own placeholder `Box` is removed.

- cd93401: feat(shell): Set the runtime version from the shell's nativeVersion

  `@lowdefy/shell` declares a `nativeVersion` in its `package.json`, bumped only when its native code changes. A shell's runtime version is `<nativeVersion>-<profile>` (with a hash of its shell plugins when it has any), so every shell on one native version and profile takes the same over-the-air updates, whatever its name, ids or icon. `runtimeVersion.js` exports `getRuntimeVersion` for `lowdefy mobile`. `check:native-version` fails when the shell's native fingerprint changes without a bump. `shell.json` takes `version` (the store version) and `eas: { owner, projectId }`, which set the app config's `version`, `owner`, `updates.url` and `extra.eas.projectId`.

- d9a6de6: feat(shell): Each shell opens exactly one app

  `shell.json` names the one app a shell opens as `app: { id, name, urls: { <environment>: url } }`, in place of the `apps` list, and the app picker is gone. Every app's `_js` runs in the shell's single JavaScript realm, so a second app in the same shell could reach the first one's session token, storage and cache. `app.config.ts` refuses a shell config that lists `apps`, names more than one app or has no url for the shell's environment, so `expo prebuild` and `expo export` fail with a message saying what to change.

- c8f85db: feat: ListOrganizations and SetActiveOrganization work on a phone

  The shell gives the core's auth actions a client over its bearer token, as the web gives its Better Auth client. `ListOrganizations` and `SetActiveOrganization` call Better Auth's `organization/list` and `organization/set-active` routes, where they failed with "undefined is not a function". A switch syncs the session the shell holds before the action resolves, so `_user.organization_id`, the roles and the pages the caller may open change at once, and the app opens afresh for the new organisation. `UpdateSession` re-syncs the caller, and `Logout` ends the phone's session on the server.

- e1c4896: feat(shell): Declare export compliance, a privacy manifest and the shell's icons in its app config

  A shell build uploads to App Store Connect and Google Play without a person answering questions: the app config declares `usesNonExemptEncryption: false` and an iOS privacy manifest with the required-reason APIs of the shell's capability profile. `shell.json` takes `icon` (a 1024×1024 PNG beside it) and `color`, which set the app icon, the splash screen and the Android adaptive icon, whose foreground the shell writes from the icon, padded into the launcher's safe zone.

### Patch Changes

- 2248ec5: fix(api,shell): A stranger can no longer keep a phone out of email-code sign-in

  The phone email-code cap (5 per 15 minutes per address) could be kept full by anyone who knew the address, and parallel requests could get past it. Now:

  - Each send takes a slot atomically, so the cap holds under parallel sends. Password-reset codes are capped too.
  - The shell keeps a random device key in secure storage and sends it on its email-code calls. A phone that has signed in by code with an address before skips the address's cap and keeps a cap of its own.
  - The server stores the key only as its SHA-256.
  - A known phone's code is held for it until it expires. A stranger's send resends the same code rather than replacing it, and only that phone may try it, so wrong tries from anywhere else cannot use it up. The phone is recorded as known only once its sign-in keeps its session, after any second factor.
  - When the cap is full, the sign-in screen asks for the newest code already sent, rather than staying on the email step.

- 7416223: fix(server, shell, client-core, build, api): Native faults reach the server log, and mobile config reports every error

  The production `/api/client-error` route now admits a phone shell's report, which carries no `Origin`, so native faults are logged instead of refused with a 403; a cross-site browser post is still refused. The log line names the surface (`mobile` with the shell version, or `web`). The shell decodes a server error the way the web client does (`decodeErrorBody`, now exported by `@lowdefy/client-core`), so it keeps its class, request id and dev error, and an auth refusal stays an expected outcome. Shell faults that were swallowed (a failed sync, page load, push token registration, background fetch, widget or tracking post, app event) are reported through the core's `handleError`, and a render fault outside a block shows a retry screen instead of closing the app. A network failure is marked where the platform's fetch rejects, so a programming fault is no longer queued as "waiting for network". Sign-in shows "Could not reach the app's server" only for a network failure, a web page that could not be opened is no longer shown as "not found", and a dev page whose plugins are still installing is never cached. Camera, microphone, calendar and location refusals are `UserError`s. The browser error handler's seen set is capped at 500 keys. A mobile sign-in refused by the organization policy is logged as BetterAuth's own refusals are. `lowdefy build` now reports every error in the `mobile` section at once instead of stopping at the first, and a shell's `shell.json` url must be absolute.

- 73fefe9: feat(blocks-native): Add the ActivityTimeline and Composer blocks

  - `ActivityTimeline` draws a record's activity on a thin rail, as GitHub's iOS app draws an issue's. Events show an icon, the actor, a sentence and a relative time ("just now", "5m", "3h", "2d", then the date), refreshed every minute. `formatEvent` words each event type with simple templates (`{actor} moved it to **{what.to|humanize}**`), a rail icon and a tone, chosen by `when` matches; an entry can also carry its own `text`, `icon` and `tone`. Detail events by one actor in a row fold into one line that opens. Gaps read "14 earlier changes by A, B and 2 others" and raise `onExpandGap`; `earlier` adds "Show earlier activity" (`onShowEarlier`).
  - Comment threads are cards with 28pt initials avatars, "via agent", "· edited", markdown bodies drawn by the Markdown block's renderer with mentions as @Name chips (muted for people who cannot see the record) and `[[KEY]]` record links (`onOpenRecord`). Replies sit flat under the first comment, the newest three with "Show N earlier replies" (`onLoadReplies`). Resolved threads fold to "Thread resolved by X · 3 replies". Reaction pills count, highlight the viewer's own and toggle at once (`onReact`). The ⋯ menu (a native menu) and a long press (the iOS action sheet) give React, Reply (`onReply`), Copy (`onCopy`), Edit on one's own (`onEdit`, in place), Resolve and Reopen (`onResolve`) and Delete on one's own or as an admin (`onDelete`, confirmed).
  - `Composer` is a comment input whose value is markdown: a field that grows from one line to eight, stays above the keyboard and has a round send button. Typing @ at a word start offers the `mentions` who see the record, ranked like the web; a pick stores `[[user:<id>]]` (`mentionFormat`) and shows "@Name" in the field, and Backspace removes a mention whole. `[[` opens a record picker fed by `onLinkSearch` (debounced 200ms) and `links`. It takes a reply-to banner (`replyTo`, `onCancelReply`), a `warning` line, a counter near `maxLength` (4000), `placeholder`, `autoFocus` and the focus method (SetFocus). `onSubmit` sends `{ body, reply_to }`, and the text clears only when its actions succeed.

- 14ad0cc: fix(client-native,blocks-native,shell): Images behind an app's sign-in load on phones

  On the web an image on the app server loads with the session cookie, but a phone sends no session, so a Markdown image or avatar photo behind the app's sign-in failed. Images now load through `components.imageSource`, which sends the session token as a bearer header to the app server's own origin only, never to another host. Sign-out also clears the images the phone cached in memory and on disk.

- 463d9e7: fix(client-native,blocks-native,shell): Keep inputs above the keyboard

  On iOS a page's scroll view now adds the keyboard to its insets, so an input low on a long form scrolls above the keyboard. On Android, where apps are edge-to-edge and the window no longer resizes for the keyboard, a Screen footer, a sticky Composer and the shell's sign-in form now pad by the keyboard as they do on iOS, counting their distance from the top of the window, as the page sits below an opaque header (`useKeyboardWindowOffset`).

- 0ccbe0c: feat(blocks-native): Add the native MultipleSelector block

  - `MultipleSelector` on mobile picks several options in a bottom sheet of checkable rows. Its value is an array of the chosen options' values, as on the web.
  - `variant: sheet` draws the field as the iOS Settings-style row a Selector `variant: sheet` draws: the title at the left, and the chosen labels joined with ", " at the right, "agent-rules, ui +2" when they overflow, or "None", then the up-down chevron. Other variants draw an input box under the title that opens the same sheet.
  - The sheet shows `menuTitle` with Done at the right, a search field past `searchThreshold`, and the options with the tinted checkmark on the chosen ones. Tapping a row toggles it without closing the sheet. The options chosen when the sheet opens are listed first, and keep their place while rows are toggled. Options take `disabled`, `description`, `avatar`, `icon`, `symbol` and `iconColor` as in the Selector, and `maxCount` limits how many can be chosen.
  - `onChange` fires once, as the sheet closes (Done, a swipe down, or its screen no longer being shown), when the set of values changed, with the new array as `_event: value`. `changeOn: toggle` fires it on each toggle instead. `onOpenChange` fires as the sheet opens and closes.
  - `allowCreate: true` adds an "Add “text”" row at the top of the sheet while the search text is no option. `createPattern` (a regular expression) checks the text, and `createPatternMessage` shows in the row while it does not match. An added value is chosen, and stays an option while the block is shown.
  - To a screen reader the rows are checkboxes with their checked state, and the field's value is the chosen labels.
  - The Selector sheet's pieces (`PickerSheet`, `PickerOptionRow`, `PickerSearchField`, `getPickerSheetRows`) now serve both blocks; a Selector sheet looks and behaves as before.

- f608867: fix(shell): Carry the shell's type manifest in its JavaScript bundle

  The shell now checks pages against a type manifest bundled with its JavaScript (`src/plugins/typeManifest.js`), not the one in the Expo config. On an embedded launch the Expo config is the one the native build embedded, so a debug shell connected to Metro showed "Update the app to open this page" for a block type added since, such as the native `Markdown` block. A JavaScript-only block type now reaches a shell from Metro or by an over-the-air update, without a native build. The manifest is no longer in the Expo config's `extra.shell`.

- 58634e1: fix(shell): Carry the shell's version in its JavaScript bundle

  The shell now reports the version of the JavaScript that runs (`src/version/shellVersion.js`), not the one in the Expo config. On an embedded launch the Expo config is the one the native build embedded, so a debug shell whose newer JavaScript came from Metro still sent the native build's version as `x-lowdefy-shell`, and showed "Update the app to open this page" for an app whose `mobile.minShellVersion` that JavaScript meets. The version is no longer in the Expo config's `extra.shell`.

- 7139e34: fix(shell): Fixes found running the shell on an iOS simulator.

  - Each tab shows its own first page. A tab read its page from the focused route, so every tab rendered the home page at start, and the hidden copy took the page's block updaters: a SetState changed state but not the screen.
  - A dev page's types are read from the deserialized page, so a page the dev server sends no longer fails with "undefined is not a function".
  - A page starts below the translucent iOS header and tab bar instead of under them.

- d17d9ab: fix(shell): Open a Screen with a large title expanded

  Before a page is first drawn, the shell sets the bar its config gives (a literal `largeTitle`, `headerSearch`, `title`, `presentation` and `backgroundTint`) and waits a frame. iOS keeps a large title collapsed when the page's scroll view was first laid out under a standard bar, and the Screen only reports its options once it renders inside that scroll view, so a cold launch opened the first page with its large title collapsed.

- bdb93fc: fix(shell): Run the quick action that launched the app once

  The app's services start again after every sign-out, and the quick action or shortcut link that launched the app stayed as it was, so the next person to sign in was sent to the shortcut's page and `onShortcut` fired again. It now runs once per launch.

- 69e497c: fix(shell): The drawer menu follows dark mode

  The drawer menu was a white panel in dark mode and its "Menu" label was invisible on a dark header. It now draws with the theme's grouped background, label and tint colours.

- 3ab9bce: fix(shell): Lowdefy Dev's network injection shows the NoConnection banner.

  The banner and the app's `online` and `offline` events read one shell online state, fed by expo-network and by the dev `network` injection. A simulator shares the computer's network, so `inject { kind: network, value: offline }` is now how to see the banner there. Subscribers hear only changes.

- c25f399: fix(shell): Every shell carries a photo library purpose text

  `expo-image` links the Photos framework, so App Store Connect refused every shell upload without `NSPhotoLibraryUsageDescription` (ITMS-90683). The `basic` profile, and so every profile, now writes it. `nativeVersion` is 3.

- ba3a756: fix(shell): Unregister a phone's push token with the session that is signing out

  Sign-out reads the device push token before it calls the app's unregister endpoint, and cleared the session token meanwhile, so the call usually went out with no session and was refused: the signed-out person's notifications kept reaching a shared phone. The call now carries the session token as it was when sign-out began.

- f1c8176: fix(shell): A deep link to a web-only page no longer spins forever

  A link to a page the app has no phone version of opens it in the browser with its query, then goes back. On a cold start, where the shell has nothing to go back to and stayed on its loading screen, it now says the page opened in the browser and offers a button home. A browser that cannot open it shows the not-found screen. Tag links and the update screen's store link no longer raise an unhandled rejection when no app opens them.

- Updated dependencies [afeec0b]
- Updated dependencies [029208c]
- Updated dependencies [b7b8445]
- Updated dependencies [163905d]
- Updated dependencies [e1cf57e]
- Updated dependencies [4d72041]
- Updated dependencies [210dd13]
- Updated dependencies [9419d09]
- Updated dependencies [df6fa3c]
- Updated dependencies [7e24234]
- Updated dependencies [31d7de8]
- Updated dependencies [29fd1a6]
- Updated dependencies [ba2ab81]
- Updated dependencies [10903fd]
- Updated dependencies [7416223]
- Updated dependencies [f05943c]
- Updated dependencies [9aa9608]
- Updated dependencies [5b19a85]
- Updated dependencies [73fefe9]
- Updated dependencies [e230b1f]
- Updated dependencies [8e4dfc8]
- Updated dependencies [dd5c2b1]
- Updated dependencies [2ce6fa5]
- Updated dependencies [22ac81f]
- Updated dependencies [2f7a526]
- Updated dependencies [bd50d64]
- Updated dependencies [cdc46e0]
- Updated dependencies [8736703]
- Updated dependencies [61ae799]
- Updated dependencies [a083b4a]
- Updated dependencies [2ce6fa5]
- Updated dependencies [a878f60]
- Updated dependencies [f0209f6]
- Updated dependencies [fe3b8e3]
- Updated dependencies [54f0579]
- Updated dependencies [14ad0cc]
- Updated dependencies [557dbb7]
- Updated dependencies [64159ca]
- Updated dependencies [463d9e7]
- Updated dependencies [048e010]
- Updated dependencies [2007fea]
- Updated dependencies [581f1ac]
- Updated dependencies [a7bca54]
- Updated dependencies [6e254bc]
- Updated dependencies [b2502ad]
- Updated dependencies [78e54ea]
- Updated dependencies [9e97d17]
- Updated dependencies [644de4e]
- Updated dependencies [be7e5a6]
- Updated dependencies [0ccbe0c]
- Updated dependencies [2ce6fa5]
- Updated dependencies [2ce6fa5]
- Updated dependencies [2ce6fa5]
- Updated dependencies [2fd3b01]
- Updated dependencies [1663aa9]
- Updated dependencies [bb7c249]
- Updated dependencies [4210b1d]
- Updated dependencies [2ce6fa5]
- Updated dependencies [96f035d]
- Updated dependencies [a310017]
- Updated dependencies [adc271f]
- Updated dependencies [3190b4d]
- Updated dependencies [4dab287]
- Updated dependencies [090d591]
- Updated dependencies [2ce6fa5]
- Updated dependencies [73982e8]
- Updated dependencies [7c85b4b]
- Updated dependencies [3cd6d62]
- Updated dependencies [a461f7c]
- Updated dependencies [3af2019]
- Updated dependencies [7aec569]
- Updated dependencies [7139e34]
- Updated dependencies [f1c8176]
- Updated dependencies [b1d42ca]
  - @lowdefy/node-utils@7.2.0
  - @lowdefy/engine@7.2.0
  - @lowdefy/client-native@7.2.0
  - @lowdefy/blocks-native@7.2.0
  - @lowdefy/operators-js@7.2.0
  - @lowdefy/client-core@7.2.0
  - @lowdefy/errors@7.2.0
  - @lowdefy/helpers@7.2.0
  - @lowdefy/actions-core@7.2.0
  - @lowdefy/operators-change-case@7.2.0
  - @lowdefy/operators-cron@7.2.0
  - @lowdefy/operators-dayjs@7.2.0
  - @lowdefy/operators-diff@7.2.0
  - @lowdefy/operators-jsonata@7.2.0
  - @lowdefy/operators-mql@7.2.0
  - @lowdefy/operators-nunjucks@7.2.0
  - @lowdefy/operators-uuid@7.2.0
  - @lowdefy/operators-yaml@7.2.0
