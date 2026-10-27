# @lowdefy/client-native

## 7.2.0

### Minor Changes

- 210dd13: feat: `@lowdefy/client-native`, a React Native renderer for Lowdefy pages

  A new package draws a Lowdefy page as native views over `@lowdefy/client-core` and the engine, for
  a native shell to use. `<LowdefyPage />` renders one page in a scroll view: block containers by
  category, visible, loading and skeletons, mount events, areas on a temporary flex layout behind
  `layoutStyles`, and a `Screen` page type whose header options go to the shell's router.
  `createNativeGlobals` gives the engine its platform from React Native: the route as `location`,
  the window size from `Dimensions` and visibility from `AppState`.

- 29fd1a6: feat(shell): Lowdefy Dev fakes device results for agents and records what you do on the phone

  - The dev-tab client answers `inject` requests: the next scan, photo or NFC read, a location or a route of them, a permission answer, and network offline or online. While offline, every fetch the app makes fails as it does with no network. Push injection is refused until the shell carries `expo-notifications`.
  - Device actions read injections through one helper, `injected(name)`, which returns nothing in a release shell. `GeolocationCurrentPosition` answers on the phone with an injected location, or a denied permission, in the web action's shape.
  - Lowdefy Dev records clicks, changes, Enter presses and page views by block id in the web recorder's record shape, labelled with the device and shell version, so `lowdefy journeys session` lists and prints phone sessions. Password inputs are never recorded.
  - The engine trace gains `reportInteraction` and `subscribeInteractions`, and the native renderer reports block presses and changes through them. The recorder's record building moves to `@lowdefy/client-core`, shared by the web and phone recorders.
  - A release shell no longer links `expo-sensors`, `react-native-view-shot` or, unless its shell config's `capabilities` include `camera`, `expo-camera`, and asks for none of their permissions. `check:release-bundle` runs `expo prebuild` and fails a release shell that still links them or asks for the camera it does not need.

- f05943c: feat(shell): Native actions, `_js`, i18n and icons in the phone shell

  Phone pages now run the same actions and operators as the web. `SetFocus`, `ScrollTo`, `CopyToClipboard` and the local storage actions have native bodies under the same names: focus goes to the control a block registers, `ScrollTo` scrolls the page to a block's measured place, the clipboard is the phone's, and local storage values live in the device store under the app's keys. `SetDarkMode` and `SetLocale` work as on the web. The shell registers the client operators of every default operator package (`_dayjs`, `_nunjucks`, `_mql`, `_jsonata`, `_uuid` and the rest).

  `_js` on mobile pages and in app events runs on the phone: the build gives the app events' client `_js` to the mobile root as module text, as it does for mobile pages. The mobile root also carries the app's `i18n`, and the shell picks the locale as the web does, with dayjs locale data for every locale. Menu icons are drawn from the root's icon data with client-native's new `Icon`, which draws the web's icon data with `react-native-svg`. The shell now passes the root's `theme` and `classMap` to client-native, so classes and the theme mode style blocks on the phone.

- dd5c2b1: feat: A native `AgentChat` block, so an app's agent works on the phone as it does on the web

  - `AgentChat` in `@lowdefy/blocks-native` talks to the same `/api/agent` route as the web block, through `@ai-sdk/react`'s `useChat`, with the web block's properties, events and methods where a phone can honour them. Replies stream in as markdown, reasoning sits behind a disclosure, tool calls are compact rows that open to their output, approvals have Reject and Approve, a failed reply has Try again, and a long press copies or regenerates. The composer sits in the Screen's footer above the keyboard, with stop while a reply streams, a new-chat button and the welcome prompts as chips. `update-page-state` writes into the page state, as on the web.
  - `threads: { module: ai-assistant, scope }` keeps the conversations through the ai-assistant module's endpoints: the chat resumes the thread last opened, saves and names each one, and the `openThreads` method opens a sheet of recent chats where a row opens one and a swipe deletes it. `threads.endpoints` names an app's own endpoints of the same shape.
  - Attachments are not on mobile yet: the `basic` shell profile has no file or image picker.
  - Native blocks get `methods.streamFetch`, a server call whose answer streams (the shell's `expo/fetch`, with the bearer session and the shell header), and `useScreenFooter` from `@lowdefy/client-native` draws a block's own chrome in the page footer. A Screen with no footer slot now leaves the footer alone.

- bd50d64: feat(blocks-native): ChipSelector block and the Screen `headerBottom` slot

  - `ChipSelector` is a mobile-only input (`valueType: string`): a horizontally scrolling strip of 32pt chips, such as a space switcher. Options take `value`, `label`, an `icon` drawn in a 20pt rounded-square tile of the option's `color`, and a `badge`. `color` is a palette hue, token or hex colour (a tile with a white icon), or `{ fg, bg, fgDark, bgDark }`, a mark drawn fg on bg with its dark mode variants. The selected chip fills with a soft tint of its own colour, with a border and label of the colour. Chips scale as they are pressed, the strip fades at its edges and keeps the selected chip in view, and an optional `moreChip: { label, icon }` fires `onMore`. Picking a chip fires `onChange` with `{ value }`.
  - `Screen` takes a `headerBottom` slot: blocks pinned directly under the header (under the large title or the search field), such as a ChipSelector and a SegmentedControl. They ride with the content as a large title collapses or the page is pulled to refresh, then stay under the header, on the screen's background with a hairline, as the page scrolls. Blocks in it sit at the 16pt screen inset; a ChipSelector runs edge to edge.
  - `LowdefyPage` takes `headerInset`, where the header's bottom edge is in the page's scroll view; the shell passes the native stack's animated header height when the page scrolls under the bar, and hides the bar's own hairline for a page with a headerBottom.
  - `@lowdefy/client-native` exports `EdgeInsetContext`, an area's horizontal padding that an edge-to-edge block cancels.

- a878f60: feat(client-native): One native icon renderer, installed as components.Icon

  `@lowdefy/client-native` now installs `components.Icon` on every page, as the web client does. It draws an icon by name from `types.icons` with the same `Icon` IconData renderer the shell's menus use, sized from the element font size (`1em` by default) and coloured from the element colour or the theme text colour. A spinning icon, or one whose `onClick` is running, draws `loading`; an unknown name draws `icon-missing`. `createIcon`, `formatIconTitle` and `toPixels` are exported for block sets.

- 64159ca: feat(blocks-native): iOS semantic theme, dark mode and native block polish

  - The native theme tokens carry the iOS semantic colours for each mode: `colorGroupedBackground`, `colorCell`, `colorCellNested`, `colorCellPressed`, `colorSystemBackground`, `colorSeparator`, `colorOpaqueSeparator`, `colorLabel`, `colorSecondaryLabel`, `colorTertiaryLabel`, `colorQuaternaryLabel`, `colorSystemFill` to `colorQuaternarySystemFill`, `colorTint` (the mode's `colorPrimary`) and `colorTintFill`. An app sets any of them per mode in `theme.antd.token`, `lightToken` or `darkToken`, and `_theme` reads them.
  - Dark mode works end to end: pages draw on the grouped background, the shell's navigators take a theme built from the tokens (in place of React Navigation's light grey default), the status bar follows the mode, and the app window takes a mode fixed by config or SetDarkMode so native bars and controls match.
  - Text follows the iOS text styles in the system font. Title levels 1 to 5 are largeTitle, title1, title2, title3 and headline, and Title and Paragraph take `textStyle`.
  - An input without a title shows no label, in place of its block id.
  - `TextInput` takes `variant: search`, the iOS search field. `TextArea` takes `variant: composer`, which grows from one line to six and shows a send button that fires the new `onSend` event and clears the field when its actions succeed.
  - `Tag` is a pill with `size` (small or default) and a leading `dot`. `Empty` is a ContentUnavailableView with `icon`, `title` and `description`. `Skeleton` shimmers and draws loading list rows with `count`, `rows` and `avatar`. `Button` takes the iOS styles (`solid` as filled, and `tinted`, `gray` and `plain`), iOS sizes and `iconPlacement`, and shows an icon alone when it has no title. `Alert` is an iOS callout, and `Card` an iOS grouped cell.

- 048e010: feat(client-native): Native pages lay out, style and theme blocks as the web does

  The new `@lowdefy/layout-native` package computes Lowdefy's 24-column layout as React Native styles: span, offset, order, push and pull per breakpoint, gaps that match the web's column widths, and flex blocks. A phone picks its breakpoint from its shorter side, so turning it to landscape keeps its layout; a tablet uses its width. The native renderer applies Tailwind `class:` values from the app's class map after operators run, with `dark:` and `sm:`/`md:`/`lg:` variants, and lays each slot's `style` over them; operator-produced and shared-page styles are converted to React Native values. `ThemeProvider` and `useTheme` give native blocks antd's computed tokens for the mode showing, following `theme.darkMode`, the `SetDarkMode` action and the device, and `_media: darkMode` works as on the web. The mobile root (`/api/mobile/root`) now sends the app's `theme` and `classMap`, in production and dev, and pages the dev server builds on request carry the class map entries of their own classes.

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

- 3190b4d: feat(blocks-native): Skeleton variants with a synced shimmer, content fade-in and ActivityTimeline link chips

  - `Skeleton` takes `variant`: `listRow`, `insetGroup`, `hero`, `paragraph`, `card` and `timeline`, each shaped like the content it stands for, with `trailing`, `header`, `lines`, and `count` as a list of section rows for `insetGroup`. `count`, `rows` and `avatar` still draw list rows.
  - The shimmer is a soft wide band that sweeps every skeleton on screen together from one 1.2s clock, in the new `colorSkeleton` and `colorSkeletonHighlight` tokens, and a static fill with Reduce Motion on. A skeleton is one "Loading" progress bar to a screen reader.
  - A block with `loading` and a `skeleton` fades its content in over 200ms when it stops loading. client-native exports `useReduceMotion`.
  - `ActivityTimeline` takes `linkChips`, as the Markdown block's, for links in comment bodies.

- 4dab287: fix: Selector option `iconColor` and icon `color` resolve through the theme on mobile

  - A Selector option's `iconColor` (the glyph in the menu and sheet rows and the sheet) takes a palette hue (`amber`, `blue`), a theme token (`colorPrimary`, `colorTint`) or a colour value, as Tag, ListItem and the other native blocks read colours.
  - The native icon renderer resolves an icon's `color` the same way, so the Icon block's `color: colorPrimary` and every icon a block draws from config (a ListItem's leading icon, a badge icon) follow the theme in light and dark mode.
  - `resolveColor` moves from `@lowdefy/blocks-native` into `@lowdefy/client-native`, which exports it.

### Patch Changes

- 029208c: fix(engine): Every mounted copy of a page re-renders when its state changes.

  A page context now keeps a set of React updaters per block (`createUpdaters`) instead of one, and each Block component adds its own while mounted and removes it on unmount. A native shell can show one page instance on two screens (in two tabs' stacks, or pushed again over itself); the copy that mounted last no longer takes the other's re-renders.

- e1cf57e: fix(client): A block render React throws away no longer keeps its updater

  A block registers its updater on render, as the engine can update it before its first commit, but only an unmount removed it. A render React discarded, such as a subtree a parent error boundary throws away, kept its updater until the page context was rebuilt. A render's registration now removes itself when no commit follows within a second, and a first commit later than that re-renders once to catch up. The native renderer's blocks do the same.

- 7416223: fix(server, shell, client-core, build, api): Native faults reach the server log, and mobile config reports every error

  The production `/api/client-error` route now admits a phone shell's report, which carries no `Origin`, so native faults are logged instead of refused with a 403; a cross-site browser post is still refused. The log line names the surface (`mobile` with the shell version, or `web`). The shell decodes a server error the way the web client does (`decodeErrorBody`, now exported by `@lowdefy/client-core`), so it keeps its class, request id and dev error, and an auth refusal stays an expected outcome. Shell faults that were swallowed (a failed sync, page load, push token registration, background fetch, widget or tracking post, app event) are reported through the core's `handleError`, and a render fault outside a block shows a retry screen instead of closing the app. A network failure is marked where the platform's fetch rejects, so a programming fault is no longer queued as "waiting for network". Sign-in shows "Could not reach the app's server" only for a network failure, a web page that could not be opened is no longer shown as "not found", and a dev page whose plugins are still installing is never cached. Camera, microphone, calendar and location refusals are `UserError`s. The browser error handler's seen set is capped at 500 keys. A mobile sign-in refused by the organization policy is logged as BetterAuth's own refusals are. `lowdefy build` now reports every error in the `mobile` section at once instead of stopping at the first, and a shell's `shell.json` url must be absolute.

- 14ad0cc: fix(client-native,blocks-native,shell): Images behind an app's sign-in load on phones

  On the web an image on the app server loads with the session cookie, but a phone sends no session, so a Markdown image or avatar photo behind the app's sign-in failed. Images now load through `components.imageSource`, which sends the session token as a bearer header to the app server's own origin only, never to another host. Sign-out also clears the images the phone cached in memory and on disk.

- 463d9e7: fix(client-native,blocks-native,shell): Keep inputs above the keyboard

  On iOS a page's scroll view now adds the keyboard to its insets, so an input low on a long form scrolls above the keyboard. On Android, where apps are edge-to-edge and the window no longer resizes for the keyboard, a Screen footer, a sticky Composer and the shell's sign-in form now pad by the keyboard as they do on iOS, counting their distance from the top of the window, as the page sits below an opaque header (`useKeyboardWindowOffset`).

- 2007fea: fix(native): Read lengths, typed numbers and html labels in linear time

  Five regular expressions in the native client took time that grew with the square of the input on long strings that do not match: a CSS length (`toPixels`, a block `size` or `flex` basis) and the text typed in a NumberInput, given a long run of digits; an option label or "supports html" text given a long run of `<`; and the app server url given a long run of `/`. A string of 100,000 such characters held the JavaScript thread for several seconds. Each now reads the same strings with a pattern that does not backtrack, so the results are unchanged. Text with an unclosed `<` before a tag now keeps that `<`: `<a<b>` shows as `<a`, where before the whole of it was dropped.

- be7e5a6: fix(blocks-native): Markdown images show on phones

  Images in the native Markdown block, AgentChat replies and ActivityTimeline comments did not show. react-native-marked's image sized itself with `Image.getSize` in an effect that ran on every render, had no height when the size could not be read, and loaded a path such as `/public/plan.png` with no server to load it from. Images now load through expo-image (svg included) at their own aspect ratio, no wider than they are or the text, with a rounded fill until they load and their alt text if they fail.

  A path in a markdown image or link is taken against the app server's url, as a browser on the app's page reads it, through the new `components.resolveUrl` that `initNativeLowdefy` installs. A path in an ActivityTimeline comment link opens on the app server rather than failing in `Linking.openURL`.

  Without `onLinkPress`, a Markdown link to an app path such as `[Orders](/orders/42)` opens that page in the app through the Link action, as AgentChat's links do.

- adc271f: fix: A loading block's skeleton takes its element style on mobile, and the hero and timeline Skeletons are inset 16pt

  - A block's `skeleton` style is split into slots as a block's style is, so `skeleton: { type: Skeleton, style: { .element: { paddingHorizontal: 16 } } }` pads the Skeleton as the same style on a Skeleton block does, and plain CSS places the skeleton. Before, the skeleton's block got no styles and its element style was lost, so hero and timeline bars touched the screen edge.
  - The `hero` and `timeline` Skeleton variants are inset 16pt from the screen edges by default, as `insetGroup` and `card` are. The element style's `paddingHorizontal` replaces the inset (0 draws them edge to edge).

- 73982e8: fix: Blocks aligned in a wrapping row on mobile take their content's height

  A block's inner view grew to fill its placement, so in a wrapping row with `align` set every line took the whole row's height and the lines after the first drew over the next block. The inner view now grows only when its placement is taller than its content: stretched by a row, or grown in a column (`fillsPlacement` in `@lowdefy/layout-native`).

- 7139e34: fix(shell): Fixes found running the shell on an iOS simulator.

  - Each tab shows its own first page. A tab read its page from the focused route, so every tab rendered the home page at start, and the hidden copy took the page's block updaters: a SetState changed state but not the screen.
  - A dev page's types are read from the deserialized page, so a page the dev server sends no longer fails with "undefined is not a function".
  - A page starts below the translucent iOS header and tab bar instead of under them.

- Updated dependencies [029208c]
- Updated dependencies [4d72041]
- Updated dependencies [9419d09]
- Updated dependencies [df6fa3c]
- Updated dependencies [31d7de8]
- Updated dependencies [29fd1a6]
- Updated dependencies [10903fd]
- Updated dependencies [7416223]
- Updated dependencies [5b19a85]
- Updated dependencies [988fc30]
- Updated dependencies [dd5c2b1]
- Updated dependencies [61ae799]
- Updated dependencies [f0209f6]
- Updated dependencies [048e010]
- Updated dependencies [2007fea]
- Updated dependencies [2ce6fa5]
- Updated dependencies [bb7c249]
- Updated dependencies [73982e8]
- Updated dependencies [7c85b4b]
- Updated dependencies [3cd6d62]
- Updated dependencies [7aec569]
- Updated dependencies [b1d42ca]
  - @lowdefy/engine@7.2.0
  - @lowdefy/client-core@7.2.0
  - @lowdefy/errors@7.2.0
  - @lowdefy/helpers@7.2.0
  - @lowdefy/style-native@7.2.0
  - @lowdefy/layout-native@7.2.0
