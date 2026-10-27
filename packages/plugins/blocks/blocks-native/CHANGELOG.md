# @lowdefy/blocks-native

## 7.2.0

### Minor Changes

- b7b8445: feat: `mobile:` key in lowdefy.yaml, with per-target block types for mobile pages

  The build understands a new `mobile:` key, the pages, menus and home page a native Lowdefy shell shows:

  ```yaml
  mobile:
    homePageId: today
    minShellVersion: 7.4.0
    menus:
      tabs:
        - { pageId: today, icon: House, title: Today }
        - { pageId: jobs, icon: ClipboardList, title: Jobs }
    pages:
      - _ref: mobile/today.yaml
      - _ref: mobile/jobs.yaml
  ```

  - `menus` takes exactly one of `tabs` (2 to 5 items), `drawer` or `stack: true`. Items are `{ pageId, icon, title }` and must open a mobile page.
  - `shells` lists the shells that open the app (`id`, `scheme`, `ios: { bundleId, teamId }`, `android: { package, sha256 }`), and `auth` is reserved for shell sign-in. An unknown key under `mobile:` fails the build.
  - Pages share one id namespace across web and mobile. A page listed in both `pages` and `mobile.pages` (for example the same `_ref`) is shared and built once; with a different config under the same id the build fails.
  - Mobile pages resolve their blocks, actions and client operators against the native block set, `@lowdefy/blocks-native`, and the `actions-core` actions. A mobile or shared page that uses a type with no native version fails the build, naming the page, block and type; `AgGrid` blocks and `Table` suggest `List` with `ListItem`. Requests, connections and server operators work on mobile pages as on web pages.
  - `_js` on a mobile page builds into the page's own `_jsEntries`, since a shell cannot load the web client's `_js` module.
  - The build writes `mobile/config.json` (home page, minimum shell version, menus with their icon data, shells), `mobile/pageIndex.json` (each mobile page's path, id, content hash and type set key) and `mobile/typeSets.json` (each type set's types with their plugin package and major version). An app without a `mobile:` key gets `{}` and `[]`. Mobile pages over 1 MB of JSON in total give a warning.
  - Every built page now carries `target`: `web`, `mobile` or `both`.

  `@lowdefy/blocks-native` is new: the native block set's types, metas and React Native components.

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

- 73fefe9: feat(blocks-native): Add the ActivityTimeline and Composer blocks

  - `ActivityTimeline` draws a record's activity on a thin rail, as GitHub's iOS app draws an issue's. Events show an icon, the actor, a sentence and a relative time ("just now", "5m", "3h", "2d", then the date), refreshed every minute. `formatEvent` words each event type with simple templates (`{actor} moved it to **{what.to|humanize}**`), a rail icon and a tone, chosen by `when` matches; an entry can also carry its own `text`, `icon` and `tone`. Detail events by one actor in a row fold into one line that opens. Gaps read "14 earlier changes by A, B and 2 others" and raise `onExpandGap`; `earlier` adds "Show earlier activity" (`onShowEarlier`).
  - Comment threads are cards with 28pt initials avatars, "via agent", "· edited", markdown bodies drawn by the Markdown block's renderer with mentions as @Name chips (muted for people who cannot see the record) and `[[KEY]]` record links (`onOpenRecord`). Replies sit flat under the first comment, the newest three with "Show N earlier replies" (`onLoadReplies`). Resolved threads fold to "Thread resolved by X · 3 replies". Reaction pills count, highlight the viewer's own and toggle at once (`onReact`). The ⋯ menu (a native menu) and a long press (the iOS action sheet) give React, Reply (`onReply`), Copy (`onCopy`), Edit on one's own (`onEdit`, in place), Resolve and Reopen (`onResolve`) and Delete on one's own or as an admin (`onDelete`, confirmed).
  - `Composer` is a comment input whose value is markdown: a field that grows from one line to eight, stays above the keyboard and has a round send button. Typing @ at a word start offers the `mentions` who see the record, ranked like the web; a pick stores `[[user:<id>]]` (`mentionFormat`) and shows "@Name" in the field, and Backspace removes a mention whole. `[[` opens a record picker fed by `onLinkSearch` (debounced 200ms) and `links`. It takes a reply-to banner (`replyTo`, `onCancelReply`), a `warning` line, a counter near `maxLength` (4000), `placeholder`, `autoFocus` and the focus method (SetFocus). `onSubmit` sends `{ body, reply_to }`, and the text clears only when its actions succeed.

- 8e4dfc8: feat: Native `AgentChat` starts a chat about a record from a seed

  The `newChat` method takes `{ sharedState, welcome, input, tag, title }` as its args, so a record page can open a chat about its record: the welcome is laid over the block's `welcome` while the chat is empty, the composer holds the input to edit or send, and the shared state is merged under `sharedState` for that conversation. With `threads`, the thread is saved with the seed's tag in place of `threads.tag` and keeps the seed's title as its name. A new `seed` property takes the same object for a chat that mounts with no thread resumed.

  ```yaml
  - id: start_task_chat
    type: CallMethod
    params:
      blockId: task_chat
      method: newChat
      args:
        - sharedState:
            task:
              key: ACME-12
          welcome:
            title: ACME-12 Fix the menu
          input: What is left on ACME-12?
          tag: ACME-12
          title: ACME-12 Fix the menu
  ```

- dd5c2b1: feat: A native `AgentChat` block, so an app's agent works on the phone as it does on the web

  - `AgentChat` in `@lowdefy/blocks-native` talks to the same `/api/agent` route as the web block, through `@ai-sdk/react`'s `useChat`, with the web block's properties, events and methods where a phone can honour them. Replies stream in as markdown, reasoning sits behind a disclosure, tool calls are compact rows that open to their output, approvals have Reject and Approve, a failed reply has Try again, and a long press copies or regenerates. The composer sits in the Screen's footer above the keyboard, with stop while a reply streams, a new-chat button and the welcome prompts as chips. `update-page-state` writes into the page state, as on the web.
  - `threads: { module: ai-assistant, scope }` keeps the conversations through the ai-assistant module's endpoints: the chat resumes the thread last opened, saves and names each one, and the `openThreads` method opens a sheet of recent chats where a row opens one and a swipe deletes it. `threads.endpoints` names an app's own endpoints of the same shape.
  - Attachments are not on mobile yet: the `basic` shell profile has no file or image picker.
  - Native blocks get `methods.streamFetch`, a server call whose answer streams (the shell's `expo/fetch`, with the bearer session and the shell header), and `useScreenFooter` from `@lowdefy/client-native` draws a block's own chrome in the page footer. A Screen with no footer slot now leaves the footer alone.

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

- a083b4a: feat(blocks-native): Native layout and display blocks

  `@lowdefy/blocks-native` now carries React Native components for `Box`, `Card`, `Divider`, `Tabs`, `Title`, `Paragraph`, `Icon`, `Tag`, `Alert`, `Empty`, `Skeleton` and `Spinner`, exported from `./blocks`.

  - Each block takes its web block's type name, properties, events, methods and slots, so a page in both `pages` and `mobile.pages` renders on web and on a phone. `Empty` is new and mobile only.
  - Blocks draw with the app's computed antd tokens in light and dark mode, and a block's own `theme` tokens apply where it has the matching token. Each block's style slots (`element`, `header`, `title`, ...) take its `class` and `style`.
  - Properties a phone cannot honour (`hoverable`, `copyable`, `animated`, `target`) are accepted and marked `nativeIgnored` in the native metas. Text that supports html on the web is shown as plain text.
  - `Tabs` is a scrolling top tab bar, with `onChange`, each tab's `eventName` and the `setActiveKey` method. `Title` and `Paragraph` support `ellipsis` with expand and collapse.
  - Blocks draw every icon through `components.Icon`, which `@lowdefy/client-native` installs.

- 2ce6fa5: feat(mobile): NFC, background location, geofences, location, maps and signatures

  `field` reads the phone's location for `GeolocationCurrentPosition` and draws the new `Map` block (Apple Maps on iOS, Google Maps on Android, with `LOWDEFY_GOOGLE_MAPS_API_KEY` at build time). `field-nfc` adds `ReadNfc` and `WriteNfc` for NDEF text and URI records. `field-tracking` adds `StartLocationTracking`, `StopLocationTracking`, `StartGeofencing` and `StopGeofencing`: points and region enter and exit post to API endpoints with the app closed, posts that fail wait for the next wake, and `onGeofence` fires while the app is open. The `SignaturePad` block draws a signature with a finger; its value is `{ svg, strokes, width, height }`, and every shell has it.

- f0209f6: feat(build): Warn when a mobile page sets a property the phone ignores

  Native blocks accept the web properties a phone cannot honour (such as `hoverable`, `copyable`, a label's `align` or an input's `prefixIcon`), so a page shared by web and mobile stays valid. The build now warns when a mobile or shared page sets one: once per page for each block type and property, naming the page, the block and the property. `~ignoreBuildChecks: [native-ignored]` silences it.

  - `extractBlockTypes` lists the property paths a meta marks `nativeIgnored: true` in the block meta it returns.
  - The native list and input blocks now mark their ignored properties `nativeIgnored`, as the layout and display blocks do.

- 54f0579: feat(blocks-native): Add an Illustration block, an animated vector drawing

  - `Illustration` draws SVG markup with keyframe animations of its elements by id: `translateX`, `translateY`, `rotate`, `scale`, `scaleX`, `scaleY` and `opacity`, with `duration`, `delay`, `loop`, `origin` and an easing per animation or keyframe (`linear`, `ease`, `easeIn`, `easeOut`, `easeInOut`, or `step` for frames that swap, as pixel art does). Each animated element is drawn in a view of its own, so the animations run on React Native's native driver. It adds no native module.
  - Colours are `var(--name)` references to `colors`, with `colorsDark` over them in dark mode; theme tokens work too (`var(--colorLabel)`).
  - `position` (`{ top, right, bottom, left }`) draws the box at those offsets from the block's place without taking room, such as a Screen's first block reaching up beside the large title, where it scrolls away with the title. It never takes touches, holds still with Reduce Motion on, and is hidden from screen readers unless it has a `title`.

- 557dbb7: feat: iOS Settings-style rows for the native NumberInput, TextInput and DateSelector

  - `variant: row` draws the input as the row a Selector `variant: menu` draws: the title at the left in Body, and the value right-aligned in the secondary label colour, or "Not set" while it is empty. The rows share the Selector row's height and padding, so an insetGrouped List mixing Selector, NumberInput, TextInput and DateSelector rows lines up.
  - Pressing a NumberInput or TextInput row focuses its field (the number keyboard for a NumberInput). A DateSelector row opens a native menu: Today, Tomorrow, Next week, "Pick a date…" (the calendar under the row) and Clear.
  - The Selector menu and sheet rows now draw their title in the iOS label colour and their value and placeholder in the secondary label colour, as these rows do.

- 64159ca: feat(blocks-native): iOS semantic theme, dark mode and native block polish

  - The native theme tokens carry the iOS semantic colours for each mode: `colorGroupedBackground`, `colorCell`, `colorCellNested`, `colorCellPressed`, `colorSystemBackground`, `colorSeparator`, `colorOpaqueSeparator`, `colorLabel`, `colorSecondaryLabel`, `colorTertiaryLabel`, `colorQuaternaryLabel`, `colorSystemFill` to `colorQuaternarySystemFill`, `colorTint` (the mode's `colorPrimary`) and `colorTintFill`. An app sets any of them per mode in `theme.antd.token`, `lightToken` or `darkToken`, and `_theme` reads them.
  - Dark mode works end to end: pages draw on the grouped background, the shell's navigators take a theme built from the tokens (in place of React Navigation's light grey default), the status bar follows the mode, and the app window takes a mode fixed by config or SetDarkMode so native bars and controls match.
  - Text follows the iOS text styles in the system font. Title levels 1 to 5 are largeTitle, title1, title2, title3 and headline, and Title and Paragraph take `textStyle`.
  - An input without a title shows no label, in place of its block id.
  - `TextInput` takes `variant: search`, the iOS search field. `TextArea` takes `variant: composer`, which grows from one line to six and shows a send button that fires the new `onSend` event and clears the field when its actions succeed.
  - `Tag` is a pill with `size` (small or default) and a leading `dot`. `Empty` is a ContentUnavailableView with `icon`, `title` and `description`. `Skeleton` shimmers and draws loading list rows with `count`, `rows` and `avatar`. `Button` takes the iOS styles (`solid` as filled, and `tinted`, `gray` and `plain`), iOS sizes and `iconPlacement`, and shows an icon alone when it has no title. `Alert` is an iOS callout, and `Card` an iOS grouped cell.

- 581f1ac: feat: Native link chips match app paths by `pattern`, not only a scheme

  A `linkChips` entry on `Markdown`, `AgentChat` and `ActivityTimeline` can take a `pattern` in place of a `scheme`: a regular expression tested against the link's address, so record links an agent writes as app paths draw as chips.

  ```yaml
  linkChips:
    - pattern: '^/ACME/tasks/(?<key>ACME-\d+)$'
      icon: CircleCheck
      tone: primary
  ```

  `[ACME-647 (Fix broken menu URL)](/ACME/tasks/ACME-647)` draws as a chip with the key `ACME-647` (the `key` group, or else the first group) and the title `Fix broken menu URL`, without the brackets. A new `label` option shows `keyAndTitle` (the default), the `key` alone, or the link `text` as written. A pressed chip goes through the same handler as any link: `onLinkPress` on Markdown, `onLinkClick` or the Link action on AgentChat.

- a7bca54: feat(blocks-native): Native List, ListItem, TextInput, TextArea, NumberInput, Selector, Switch, DateSelector and Button

  `@lowdefy/blocks-native` now has components, exported from `./blocks`, for the first list, input and action blocks. They keep the web blocks' names, properties, events, methods and value types, so a page shared with the web works on a phone; web properties a phone cannot honour are accepted and described as ignored on mobile.

  - `TextInput`, `TextArea` and `NumberInput` use React Native's text input with the keyboard each input needs (email, phone, URL, number or decimal pad, hidden password entry). `NumberInput` keeps its value within `min` and `max` and rounds to `precision` when it loses focus, and shows step buttons with `mode: spinner`.
  - `Selector`, `Switch` and `DateSelector` use `@expo/ui`'s native picker, switch and date picker, now a dependency of the shell. `Selector` options may hold any value, as on the web, and `appearance: wheel` shows the iOS scroll wheel. `DateSelector` sets the picked day at midnight UTC, as on the web, and takes `disabledDates.min` and `max`.
  - Every input has the web label: title, `required` mark, colon when inline, extra text, and the validation message once `Validate` shows it.
  - `List` keeps the web model (an array in state, its `content` slot per item, and `pushItem`, `unshiftItem`, `removeItem`, `moveItemUp` and `moveItemDown`) and renders with a virtualised list. Phone-only: `swipeActions` (buttons a swiped item shows, each firing the event it names with the item index), `sectionKey` (sticky section headers) and the `onRefresh` event (pull to refresh, for a List with `scroll: true`).
  - `ListItem` is new: a list cell with a title, description, avatar or icon, a detail on the right and a chevron, and `onClick`.
  - `Button` follows `color`, `variant`, `danger`, `ghost`, `size`, `shape`, `block` and the deprecated `type`, and shows a spinner while its `onClick` runs.
  - Blocks draw with the app's theme tokens in light and dark mode, with a block's own `theme` overrides over them, under its classes and style.

- b2502ad: feat: A tinted checkmark accessory on the native ListItem

  - `trailing: { check: true }` draws the iOS checkmark (the `checkmark` SF Symbol at 17pt semibold, in the tint colour) at the end of the row, where the chevron goes, for the picked rows of a multi-select list such as labels in a sheet. A checked row has no chevron unless `chevron: true`, and a screen reader reads it as selected.

- 78e54ea: feat(blocks-native): iOS lists and rows, and the Avatar and StatusIcon blocks

  - `List` takes `variant`: `insetGrouped` (the default) draws each section as a rounded group of cells, inset 16pt on the grouped background, with separators inset to the row text; `plain` draws edge to edge rows with sticky section headers. Sections come from `header` (one section) or `sectionKey` with `sections` (`[{ key, title, count, status, footer }]`, in that order, empty ones hidden). `showCount` counts each section's items, and `headerVariant` picks Footnote upper case or Headline headers.
  - `ListItem` takes `leading` (a status glyph, avatar or icon) and `trailing` (text, badges, a glyph, an icon or avatars) properties and slots, a `subtitle`, `titleLines`, an iOS press highlight, `swipeActions` (`leading` and `trailing` buttons with a full swipe, firing `onSwipeAction` with the id) and `contextMenu` (iOS's native long-press menu, firing `onContextMenu` with the id). It becomes a container block for its slots.
  - `Avatar` draws a person's initials on a colour picked from their name, or their image, and stacks several with `avatars`.
  - `StatusIcon` draws Linear-style status, priority and stage glyphs by name, coloured for light and dark mode.

- 9e97d17: feat(blocks-native): Native Markdown block

  `@lowdefy/blocks-native` now carries a read-only `Markdown` block that draws GitHub-flavoured markdown with React Native views: headings, emphasis, strikethrough, inline and fenced code, block quotes, ordered, unordered and task lists, tables, images and links.

  - It takes the web `Markdown` block's `content` and `skipHtml`, so a page in both `pages` and `mobile.pages` can use it. Raw HTML shows as text, as the web block escapes it, and `skipHtml: true` leaves it out.
  - A new `onLinkPress` event receives the pressed link's `href` as `_event: href`, and the block does not open the link. Without the event, a link opens in the system browser.
  - Text, headings and code take the app's computed antd tokens in light and dark mode.
  - It draws with `react-native-marked`, which is plain JavaScript. It needs no native module beyond the `basic` shell profile.

- 0ccbe0c: feat(blocks-native): Add the native MultipleSelector block

  - `MultipleSelector` on mobile picks several options in a bottom sheet of checkable rows. Its value is an array of the chosen options' values, as on the web.
  - `variant: sheet` draws the field as the iOS Settings-style row a Selector `variant: sheet` draws: the title at the left, and the chosen labels joined with ", " at the right, "agent-rules, ui +2" when they overflow, or "None", then the up-down chevron. Other variants draw an input box under the title that opens the same sheet.
  - The sheet shows `menuTitle` with Done at the right, a search field past `searchThreshold`, and the options with the tinted checkmark on the chosen ones. Tapping a row toggles it without closing the sheet. The options chosen when the sheet opens are listed first, and keep their place while rows are toggled. Options take `disabled`, `description`, `avatar`, `icon`, `symbol` and `iconColor` as in the Selector, and `maxCount` limits how many can be chosen.
  - `onChange` fires once, as the sheet closes (Done, a swipe down, or its screen no longer being shown), when the set of values changed, with the new array as `_event: value`. `changeOn: toggle` fires it on each toggle instead. `onOpenChange` fires as the sheet opens and closes.
  - `allowCreate: true` adds an "Add “text”" row at the top of the sheet while the search text is no option. `createPattern` (a regular expression) checks the text, and `createPatternMessage` shows in the row while it does not match. An added value is chosen, and stays an option while the block is shown.
  - To a screen reader the rows are checkboxes with their checked state, and the field's value is the chosen labels.
  - The Selector sheet's pieces (`PickerSheet`, `PickerOptionRow`, `PickerSearchField`, `getPickerSheetRows`) now serve both blocks; a Selector sheet looks and behaves as before.

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

- 1663aa9: feat(client-native): A Screen headerBackdrop slot, and options reported before first paint

  - A Screen's `headerBackdrop` slot draws blocks above the top of the content, behind the large title and the translucent bar, such as an Illustration beside the title. They scroll away with the title, take no room in the content and never take touches. The backdrop is lifted by a transform, so the scroll view's content keeps its layout.
  - A Screen reports its header options in a layout effect, so the router enables a large title in the same update as the page's first content and the page opens with its large title expanded.
  - `useScreenFocused` tells a block whether its screen is the one shown.
  - An Illustration stops its animations while its screen is hidden, and draws each still layer only over the part of the drawing it covers, so a drawing split into many layers holds small backing stores.

- bb7c249: feat(client-native): iOS Screen headers, tab bar icons and per-screen page state

  - `Screen` takes `largeTitle` (an iOS large title that collapses as the page scrolls), `headerSearch` (a native search bar with `placeholder`, `autoFocus`, `debounce` and `hideWhenScrolling`, firing `onSearch` and `onSearchChange` with `_event: value`) and `headerActions` (`[{ id, icon, sfSymbol, title, placement, event, disabled }]`, compact icon buttons that iOS draws as native SF Symbol bar buttons, firing `onHeaderAction` with `_event: id` or their own `event`).
  - `Screen` events `onRefresh` (pull-to-refresh, refreshing until the actions finish) and `onFocus` (each time the screen is shown: first show after onMount, a tab switch, back navigation).
  - The `headerLeft` and `headerRight` slots draw their blocks at their natural size, so a header button is no longer a full-width capsule that truncates the title.
  - Two screens of one page in a stack keep their own page state, keyed by route instance, and each reads `_url_query` and `_location` from its own route, not the focused one. A tab's page opened by a link keeps its query.
  - `mobile.menus.tabs` items draw their icon in the native tab bar: an SF Symbol on iOS (`sfSymbol`, or the symbol mapped from the Lucide or semantic icon name), the Lucide icon elsewhere, the selected tab in the theme's primary colour. `role: search` makes an item iOS 26's search tab.
  - The engine's `getContext` takes an `instanceId` and the screen's own `globals`.

- 4210b1d: feat(blocks-native): Selector `variant: sheet`, a picker sheet that shows avatar pictures

  - Selector takes `variant: sheet`: the property row of `variant: menu`, opening a bottom sheet of the options in place of a native menu, as the assignee pickers of Linear's and GitHub's iOS apps. Native menus draw SF Symbols only; the sheet draws each option's avatar picture (or its initials), SF Symbol or icon.
  - The sheet centres `menuTitle` with a close button, shows a search field when there are more options than `searchThreshold` (default 7) that matches labels ignoring case and accents, and lists 52pt rows with an optional `description` and a checkmark in the tint colour on the chosen row. Options with `pinned: true` sit in a group at the top, under the placeholder item drawn as a dashed circle, above a hairline.
  - A short list rests at the medium detent; a long list or one with a search field can be dragged to the large detent, which focusing the search field opens. Picking a row fires onChange (and onClear for the placeholder) as the menu does and closes the sheet.
  - @lowdefy/build's native block types list the Selector's new fallback icons.

- 2ce6fa5: feat(mobile): Share out from every shell, share in with the `share` extension

  The `Share` action opens the share sheet with text, a link, a file on the phone, an https file the shell downloads first, or `base64` content with a `name` (a PDF made on the page). `mobile.shells[].extensions: [share]` adds expo-sharing's share extension: text, links, images, videos and files shared into the app open `mobile.share.pageId` with the payload in the `shared` query key and fire the `onShare` app event. Shell extensions are a new opt-in list (`share`, `widgets`, `contacts`, `calendar`) on top of the profile, written into shell.json by `lowdefy mobile config` and named in the runtime version.

- 3190b4d: feat(blocks-native): Skeleton variants with a synced shimmer, content fade-in and ActivityTimeline link chips

  - `Skeleton` takes `variant`: `listRow`, `insetGroup`, `hero`, `paragraph`, `card` and `timeline`, each shaped like the content it stands for, with `trailing`, `header`, `lines`, and `count` as a list of section rows for `insetGroup`. `count`, `rows` and `avatar` still draw list rows.
  - The shimmer is a soft wide band that sweeps every skeleton on screen together from one 1.2s clock, in the new `colorSkeleton` and `colorSkeletonHighlight` tokens, and a static fill with Reduce Motion on. A skeleton is one "Loading" progress bar to a screen reader.
  - A block with `loading` and a `skeleton` fades its content in over 200ms when it stops loading. client-native exports `useReduceMotion`.
  - `ActivityTimeline` takes `linkChips`, as the Markdown block's, for links in comment bodies.

- 2ce6fa5: feat(mobile): Widgets, quick actions, App Shortcuts and background fetch

  `mobile.widgets` lists widget sources (`{ id, title, layout: count | list, endpointId, path }`) for shells with the `widgets` extension: iOS Home Screen and Lock Screen widgets in two fixed layouts, the source picked when the widget is added, refreshed from the endpoints at launch, on resume, on a push with `data.refreshWidgets`, on background fetch and on `RefreshWidgets`. `mobile.shortcuts` (up to 4) become the app icon's quick actions on iOS and Android and the options of one App Shortcuts intent ("Open <shortcut> in <app>") for Siri and Spotlight; choosing one opens its path and fires `onShortcut`. `mobile.background: { endpointId, interval }` runs background fetch while the app is closed: the endpoint's `{ badge, refreshWidgets }` is applied, the offline queue is sent and the cached pages refresh. The build checks every endpoint and page these name.

### Patch Changes

- e230b1f: fix: A native `AgentChat` chat started with `newChat` while the last thread is still resuming is no longer replaced by that thread when `get-active-thread` answers. Starting or opening a chat cancels the pending resume.
- 22ac81f: fix(blocks-native): Avatar photos from app paths load on phones

  An avatar whose `src` is a path on the app server (`/avatars/u1.png`) showed only its initials on a phone, in Avatar, ListItem, ActivityTimeline, Composer suggestions and selector options. The path is now taken against the app server, as the Markdown block's images are.

- cdc46e0: fix(blocks-native): A swipe Box takes swipes across a ChipSelector

  A `ChipSelector` scrolls only when its chips overflow, and does not bounce when they fit, so a `Box` with `onSwipeLeft` or `onSwipeRight` around it takes swipes across the chips. A strip that overflows passes a drag that pulls it past an end it cannot scroll further toward on as the Box's swipe that way.

- fe3b8e3: fix(blocks-native): An Illustration's user-space gradients fade where the drawing puts them

  react-native-svg on iOS does not place a `gradientUnits="userSpaceOnUse"` gradient in the drawing's coordinates, so a fade drawn that way showed as a flat fill. An Illustration now redraws each shape's user-space linear gradient along an axis in the shape's own bounding box, the units every platform draws, so the fade lands where the drawing puts it, in cropped layers too.

- 14ad0cc: fix(client-native,blocks-native,shell): Images behind an app's sign-in load on phones

  On the web an image on the app server loads with the session cookie, but a phone sends no session, so a Markdown image or avatar photo behind the app's sign-in failed. Images now load through `components.imageSource`, which sends the session token as a bearer header to the app server's own origin only, never to another host. Sign-out also clears the images the phone cached in memory and on disk.

- 463d9e7: fix(client-native,blocks-native,shell): Keep inputs above the keyboard

  On iOS a page's scroll view now adds the keyboard to its insets, so an input low on a long form scrolls above the keyboard. On Android, where apps are edge-to-edge and the window no longer resizes for the keyboard, a Screen footer, a sticky Composer and the shell's sign-in form now pad by the keyboard as they do on iOS, counting their distance from the top of the window, as the page sits below an opaque header (`useKeyboardWindowOffset`).

- 2007fea: fix(native): Read lengths, typed numbers and html labels in linear time

  Five regular expressions in the native client took time that grew with the square of the input on long strings that do not match: a CSS length (`toPixels`, a block `size` or `flex` basis) and the text typed in a NumberInput, given a long run of digits; an option label or "supports html" text given a long run of `<`; and the app server url given a long run of `/`. A string of 100,000 such characters held the JavaScript thread for several seconds. Each now reads the same strings with a pattern that does not backtrack, so the results are unchanged. Text with an unclosed `<` before a tag now keeps that `<`: `<a<b>` shows as `<a`, where before the whole of it was dropped.

- 6e254bc: fix(blocks-native): ListItem's context menu shows every item on Android

  On Android a ListItem `contextMenu` showed in an alert, which keeps only the first three buttons and cannot be dismissed, so Cancel and every item after the third were lost and the person had to pick one. A long press now opens a Material menu with every item, dismissed by back or a tap outside.

- 644de4e: fix(blocks-native): Markdown link chips wrap with the text as inline words

  A link chip in a list item or paragraph took the whole line when its title was long, so the rest of the sentence wrapped onto a new line that started with its full stop. A chip is now as wide as its content, at most three quarters of the line when text follows it (the whole line when it ends the paragraph), measured against the text it sits in, so a chip in a list item is capped by the item's text column rather than the block's width. Past that its title is cut short and its key never is. Closing punctuation right after a chip (`.`, `,`, `;`, `:`, `)`, `?`, `!`) is drawn inside the chip's inline view, so it never starts a line, and a chip that does not fit on a line moves to the next one whole.

- be7e5a6: fix(blocks-native): Markdown images show on phones

  Images in the native Markdown block, AgentChat replies and ActivityTimeline comments did not show. react-native-marked's image sized itself with `Image.getSize` in an effect that ran on every render, had no height when the size could not be read, and loaded a path such as `/public/plan.png` with no server to load it from. Images now load through expo-image (svg included) at their own aspect ratio, no wider than they are or the text, with a rounded fill until they load and their alt text if they fail.

  A path in a markdown image or link is taken against the app server's url, as a browser on the app's page reads it, through the new `components.resolveUrl` that `initNativeLowdefy` installs. A path in an ActivityTimeline comment link opens on the app server rather than failing in `Linking.openURL`.

  Without `onLinkPress`, a Markdown link to an app path such as `[Orders](/orders/42)` opens that page in the app through the Link action, as AgentChat's links do.

- 96f035d: fix: A native Sheet or Selector picker sheet closes when its screen stops being shown

  An open `Sheet` or `variant: sheet` Selector closes when its screen is no longer the one shown, such as after a tab switch or a navigation. A sheet is drawn above the whole app, so before it stayed over the next screen.

- a310017: fix(blocks-native): A tap on a sheet straight after its content changes is no longer dropped

  On iOS, a Sheet or a picker sheet that was drawn again (a MultipleSelector toggle, or a block in the sheet changing) passed its sheet a new background style and detents, which re-applied the sheet's presentation and cancelled the next touch for about half a second. The sheet now keeps the same props while they are unchanged, so tapping Done or a row right after a toggle works.

- adc271f: fix: A loading block's skeleton takes its element style on mobile, and the hero and timeline Skeletons are inset 16pt

  - A block's `skeleton` style is split into slots as a block's style is, so `skeleton: { type: Skeleton, style: { .element: { paddingHorizontal: 16 } } }` pads the Skeleton as the same style on a Skeleton block does, and plain CSS places the skeleton. Before, the skeleton's block got no styles and its element style was lost, so hero and timeline bars touched the screen edge.
  - The `hero` and `timeline` Skeleton variants are inset 16pt from the screen edges by default, as `insetGroup` and `card` are. The element style's `paddingHorizontal` replaces the inset (0 draws them edge to edge).

- 4dab287: fix: Selector option `iconColor` and icon `color` resolve through the theme on mobile

  - A Selector option's `iconColor` (the glyph in the menu and sheet rows and the sheet) takes a palette hue (`amber`, `blue`), a theme token (`colorPrimary`, `colorTint`) or a colour value, as Tag, ListItem and the other native blocks read colours.
  - The native icon renderer resolves an icon's `color` the same way, so the Icon block's `color: colorPrimary` and every icon a block draws from config (a ListItem's leading icon, a badge icon) follow the theme in light and dark mode.
  - `resolveColor` moves from `@lowdefy/blocks-native` into `@lowdefy/client-native`, which exports it.

- 090d591: fix(blocks-native): ActivityTimeline opens an app path in a comment as a page

  Without `onLinkPress`, a link to an app path in a comment (`[the order](/orders/42)`) opened the app's web page in the browser, where the person is not signed in. It now opens the page in the app through the Link action, as the Markdown block and AgentChat do.

- f1c8176: fix(shell): A deep link to a web-only page no longer spins forever

  A link to a page the app has no phone version of opens it in the browser with its query, then goes back. On a cold start, where the shell has nothing to go back to and stayed on its loading screen, it now says the page opened in the browser and offers a button home. A browser that cannot open it shows the not-found screen. Tag links and the update screen's store link no longer raise an unhandled rejection when no app opens them.

- Updated dependencies [029208c]
- Updated dependencies [e1cf57e]
- Updated dependencies [210dd13]
- Updated dependencies [31d7de8]
- Updated dependencies [29fd1a6]
- Updated dependencies [7416223]
- Updated dependencies [f05943c]
- Updated dependencies [988fc30]
- Updated dependencies [dd5c2b1]
- Updated dependencies [bd50d64]
- Updated dependencies [61ae799]
- Updated dependencies [a878f60]
- Updated dependencies [f0209f6]
- Updated dependencies [14ad0cc]
- Updated dependencies [64159ca]
- Updated dependencies [463d9e7]
- Updated dependencies [048e010]
- Updated dependencies [2007fea]
- Updated dependencies [be7e5a6]
- Updated dependencies [2fd3b01]
- Updated dependencies [1663aa9]
- Updated dependencies [bb7c249]
- Updated dependencies [adc271f]
- Updated dependencies [3190b4d]
- Updated dependencies [4dab287]
- Updated dependencies [73982e8]
- Updated dependencies [3cd6d62]
- Updated dependencies [a461f7c]
- Updated dependencies [7139e34]
- Updated dependencies [b1d42ca]
  - @lowdefy/client-native@7.2.0
  - @lowdefy/helpers@7.2.0
  - @lowdefy/style-native@7.2.0
  - @lowdefy/block-utils@7.2.0
