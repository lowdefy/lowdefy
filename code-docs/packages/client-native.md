# @lowdefy/client-native

The React Native renderer (`packages/client-native`). It is the native counterpart of the web
renderer in `@lowdefy/client`, over the same `@lowdefy/client-core` and `@lowdefy/engine`.

## Shape

| File                                                             | Does                                                                         |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `LowdefyPage.js`                                                 | One page: deserializes config, builds the core once, ScrollView, context     |
| `initNativeLowdefy.js`                                           | `createLowdefyCore` with the native host, Link, Screen; `updateLowdefyPage`  |
| `Context.js`, `MountEvents.js`                                   | Engine page context, app and page onInit, lifecycle and websocket effects    |
| `block/Block.js`                                                 | Updater, parse-error logging, error boundary, onMount, category switch       |
| `block/Container.js`, `List.js`, `Display.js`, `LoadingBlock.js` | Mirror the web block containers                                              |
| `block/BlockLayout.js`, `Area.js`                                | Views styled by `layoutStyles`; `testID` and `accessibilityLabel` = block id |
| `layout/layoutStyles.js`                                         | `layoutStyles(layout, breakpoint, columnGap)`, from `@lowdefy/layout-native` |
| `style/useBlockStyles.js`, `getBlockStyles.js`                   | Each slot's classes (from the class map) with its `style` over them          |
| `style/classStyle.js`                                            | Class lookup: `dark:` and breakpoint variants, `dark:<class>` entries        |
| `style/slotStyle.js`                                             | Converts shared-page and operator styles with `@lowdefy/style-native`        |
| `theme/ThemeProvider.js`, `useTheme.js`                          | Theme mode and the computed antd tokens of that mode                         |
| `globals/createNativeGlobals.js`                                 | Host globals: route `location`, `Dimensions`, `AppState`, network events     |
| `globals/createScreenGlobals.js`                                 | One screen's globals: the app's, with `location` the screen's own route      |
| `link/setupLink.js`                                              | Page links through the host router, others through `Linking`                 |
| `screen/Screen.js`                                               | The `Screen` page type; reports header options to `onScreenOptions`          |
| `screen/HeaderActionButton.js`                                   | A header action as a natural-size icon button                                |
| `screen/HeaderBottom.js`, `getHeaderBottomMotion.js`             | A Screen's headerBottom, pinned under the header by the page's scroll offset |
| `layout/EdgeInsetContext.js`                                     | An area's horizontal padding, which an edge-to-edge block cancels            |
| `trace/describeBlock.js`                                         | The trace's element description, by block id                                 |
| `elements/createElementRegistry.js`, `useElementRef.js`          | Native views by page and block id (`globals.elements`), for native actions   |
| `icon/Icon.js`                                                   | Draws IconData (the web's icon node data) with `react-native-svg`            |
| `icon/createIcon.js`                                             | `components.Icon`: an icon by name from `types.icons`, drawn with `Icon`     |
| `icon/getSfSymbol.js`, `sfSymbolNames.js`                        | The SF Symbol of a Lucide or semantic icon name, for iOS tab and bar buttons |

## Differences from the web renderer

- `visible: false` draws nothing (the web keeps a hidden `div` for its id).
- There are no class names, `Head`, shortcuts, progress bar or antd providers.
- Layout is `@lowdefy/layout-native` (see its doc). A gapped area is two views (the slot style
  outside, the widened row inside), and a block in it is two views (the placement with the gap
  padding outside, the view with its `testID` and `style.block` inside). An area sorts its blocks
  by layout order, which React Native has no style for. The breakpoint comes from the window's
  shorter side on a phone, so it is not the `_media: size` of a landscape phone.
- `class` and `style` reach a block as one `styles` prop, a React Native style per slot: the
  slot's classes looked up in the class map, then its `style`. A block lays its defaults and
  theme tokens under it: block defaults, theme, class, style. The class map is the root config's
  `classMap` with a dev page's own `_classMap` over it. Plain classes always apply, `dark:`
  classes in dark mode, `sm:`/`md:`/`lg:` classes from their breakpoint up; breakpoint classes go
  over plain ones and dark classes over both, as Tailwind orders its CSS. In dark mode a class
  reads its `dark:<class>` entry first (the build adds one for antd colour classes). A class with
  no entry is ignored, with a development warning once per class.
- Styles of a shared page (`target: both`) and any style slot that is or holds an operator are
  converted at render with `convertStyle`; keys React Native cannot honour are left out and
  reported through `handleError` as a `ConfigError`.
- `ThemeProvider` holds the theme mode as the web's `useDarkMode` does: `theme.darkMode`, then
  the stored preference (`appStorageKey` `lowdefy_darkMode`), then the device's colour scheme.
  It sets `__lowdefy_setDarkMode`, `__lowdefy_darkModePreference` and `__lowdefy_isDark` on the
  host window for `SetDarkMode` and `_media`. A page re-renders on a mode change, so the
  engine's render-time full pass re-evaluates `_media: darkMode` and `_theme`, and
  `lowdefy.theme._resolvedAntdToken` is the mode's tokens. A shell wraps its pages in one
  provider; a `LowdefyPage` outside one makes its own. A Screen's `headerRight` carries the
  page's theme, breakpoint and class map into the header the router draws.
- There is no `document.getElementById`. Each `BlockLayout` view registers in the host's element
  registry (`globals.elements`, from `createNativeGlobals`) as the block's `view`, and the page's
  ScrollView as its `scroll`, while mounted. A block registers the control it focuses with
  `useElementRef({ blockId, kind: 'input' })`. The shell's native `SetFocus` and `ScrollTo` find
  them by the page and block id; the view registered last wins, so a page on screen twice
  answers for the one on top.
- `Icon` draws the same IconData as the web (`{ node, attrs, size }`), with lucide's defaults
  (24px, `currentColor` stroke 2) under a set's own attributes. It is the one icon renderer:
  the shell draws menu icons with it, and `initNativeLowdefy` installs `createIcon({ icons:
types.icons, iconTheme: theme.icons })` as `components.Icon`, which blocks draw every icon
  through. Its props follow the web's (`properties` is a name or the Icon block's properties);
  an element style's `color` and `fontSize` stand in for CSS `currentColor` and `1em`. It looks
  names up in `types.icons` at render (with `loading` for a spin and `icon-missing` for an
  unknown name), and draws an empty icon when the data has neither. Each built mobile page
  carries the data of its icons as `_icons`, which the shell adds to `types.icons` before the
  page renders. On iOS the tab bar and header actions draw SF Symbols instead: `getSfSymbol`
  maps Lucide names and Lowdefy's semantic names (`Inbox` to `tray`, `edit` to `pencil`), and a
  config's `sfSymbol` wins; a name with no symbol draws as its Lucide icon.
- A shell shows several pages at once (a stack under each tab). `LowdefyPage` takes the screen's
  `instanceId` (its route key) and `routePath` (its path and query). The engine keeps a context
  per route instance (`{pageKey}@{instanceId}`), so task B pushed on task A has its own state, and
  A's state is untouched when B is popped. A screen's first visit takes the Link input left under
  the page key. The context reads `createScreenGlobals`, whose `location` is the screen's own
  route, so `_url_query` and `_location` are the query this screen was opened with, whichever
  screen rendered or took focus last. Without them, a page has one context and reads the host's
  shown route, as before.
- `Screen` reports its header to the shell's router (`onScreenOptions`): `title`, `largeTitle`,
  `presentation`, `headerLeft` and `headerRight` (slot render functions), `headerActions` (icon
  buttons with an SF Symbol from `getSfSymbol`, an `onPress` and a `render` that draws a
  `HeaderActionButton`) and `headerSearch` (search bar callbacks; `onSearchChange` is debounced).
  Header slots render inside `NaturalSizeContext`, so `BlockLayout` gives their blocks their
  content's size rather than a column width; a span-24 block would stretch the native bar item
  across the header and truncate the title. `ScreenContext` carries the screen's `focused` flag
  (onFocus fires on each false-to-true change, the first one after onMount) and `setRefresh`,
  which turns on the page ScrollView's `RefreshControl` for `onRefresh` and holds `refreshing`
  until the event's promise settles.
- A Screen's `headerBottom` slot is drawn by the Screen block itself, as the page's first content
  (`HeaderBottom`, `zIndex: 1` over the content after it), not by the router: React Native's
  `stickyHeaderIndices` pin at the scroll view's top, which on iOS is under the translucent bar.
  `ScreenContext` carries `scrollY` (the page `Animated.ScrollView`'s offset, an `Animated.event`
  on the native driver) and `headerInset` (the `headerInset` prop: where the bar's bottom edge is
  in the scroll view's frame). The strip moves down by `max(0, scrollY + headerInset)`
  (`getHeaderBottomMotion`), the distance the page has scrolled past the bar: at rest under a bar
  the offset is minus the header height, so it is 0; as a large title collapses the header height
  falls with the offset and it stays 0; pulled to refresh it is negative and clamped, so the strip
  rides with the content and the spinner shows above it; once the bar is compact the strip is
  pinned. Pinned, a surface in `colorGroupedBackground` reaching up over the bar (iOS 26's bar is
  clear glass the page scrolls under) and a hairline in `colorSeparator` fade in over 6pt. The
  slot pads its blocks to the 16pt screen inset and provides it in `EdgeInsetContext`, which a
  ChipSelector cancels to run edge to edge. The Screen reports `headerBottom: true`, and the
  shell's router hides the bar's own hairline.
- The engine's `window` and `document` keys hold plain objects. `focus` and `blur` have no
  source on a phone; `online` and `offline` follow the `network` the shell passes.

## Tests

Jest runs with the `@react-native/jest-preset` (babel-jest and React Native's mocks) and
`@testing-library/react-native`, not the repository's ESM swc setup. `src/test/removeWindow.js`
deletes React Native's `window` alias, so a stray `window` read fails. Test blocks and a small
build-shaped page helper live in `src/test/`; `@lowdefy/build` does not load under the preset.
`intl-messageformat` and `@formatjs/*` ship ES modules and static class blocks, so the Jest config
transforms them, and Babel adds the static class block plugin.
