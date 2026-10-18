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
| `screen/ScreenTint.js`, `createTintStore.js`                     | A Screen's backgroundTint, a gradient fixed behind the page, cross-faded     |
| `screen/getBackgroundTint.js`, `getTintStops.js`                 | The tint's colour and opacity in the mode showing; its eased gradient stops  |
| `layout/EdgeInsetContext.js`                                     | An area's horizontal padding, which an edge-to-edge block cancels            |
| `motion/FadeInView.js`, `useReduceMotion.js`                     | Content fading in after a skeleton; the system Reduce Motion setting         |
| `trace/describeBlock.js`                                         | The trace's element description, by block id                                 |
| `elements/createElementRegistry.js`, `useElementRef.js`          | Native views by page and block id (`globals.elements`), for native actions   |
| `block/createStreamFetch.js`                                     | `methods.streamFetch`: a block's streamed server call, with the bearer token |
| `screen/useScreenFooter.js`                                      | A block draws its own chrome in the page footer (AgentChat's composer)       |
| `icon/Icon.js`                                                   | Draws IconData (the web's icon node data) with `react-native-svg`            |
| `icon/createIcon.js`                                             | `components.Icon`: an icon by name from `types.icons`, drawn with `Icon`     |
| `theme/resolveColor.js`                                          | A configured colour (palette hue, token name, hex) as the theme draws it     |
| `icon/getSfSymbol.js`, `sfSymbolNames.js`                        | The SF Symbol of a Lucide or semantic icon name, for iOS tab and bar buttons |

## Differences from the web renderer

- `visible: false` draws nothing (the web keeps a hidden `div` for its id).
- A loading block with a `skeleton` draws the skeleton in its place (`LoadingBlock`). When it
  stops loading, `CategorySwitch` passes `fadeIn` and `BlockLayout` draws its outer view as a
  `FadeInView`, so the content fades in over 200ms where the skeleton was (at once with Reduce
  Motion on). Only a block that showed its own skeleton fades; a separate Skeleton block toggled
  by `visible` does not, so pages put `loading` and `skeleton` on the block that loads.
- There are no class names, `Head`, shortcuts, progress bar or antd providers.
- Layout is `@lowdefy/layout-native` (see its doc). A gapped area is two views (the slot style
  outside, the widened row inside), and a block in it is two views (the placement with the gap
  padding outside, the view with its `testID` and `style.block` inside, which fills the placement
  only when `fillsPlacement` says so; the area passes its column gap and container style down in
  `AreaContext`). A slot whose blocks are all hidden is not passed to its block
  (`useVisibleSlots`), so a header slot of hidden blocks draws no glass button. An area sorts its blocks
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
  `properties.color` resolves through the theme (`resolveColor`: `amber`, `colorPrimary`, a hex);
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
- The page ScrollView is keyed by the route instance, so a scroll position is kept only for the
  instance it was scrolled on. A host gives one `pageConfig` object per version of a page
  (`deserializeConfig` deserializes each once): a new object while the screen shows the old one
  rebuilds the screen's kept context once (`getContextReset` raises `resetContext`), on the same
  screen and scroll view, so a version the shell fetched in the background shows at once.
- `Screen` reports its header to the shell's router (`onScreenOptions`): `title`, `largeTitle`,
  `presentation`, `headerLeft` and `headerRight` (slot render functions), `headerActions` (icon
  buttons with an SF Symbol from `getSfSymbol`, an `onPress`, a `menu` of items (`id`, `title`,
  `symbol`, `destructive`, `disabled`, `onPress`) or null, and a `render` that draws a
  `HeaderActionButton`, which opens the menu in a `Modal` where the shell has no native menu)
  and `headerSearch` (search bar callbacks; `onSearchChange` is debounced).
  Header slots render inside `NaturalSizeContext`, so `BlockLayout` gives their blocks their
  content's size rather than a column width; a span-24 block would stretch the native bar item
  across the header and truncate the title. `ScreenContext` carries the screen's `focused` flag
  (onFocus fires on each false-to-true change, the first one after onMount), `setRefresh`,
  which turns on the page ScrollView's `RefreshControl` for `onRefresh` and holds `refreshing`
  until the event's promise settles (whether the control is there is read from the page config's
  `onRefresh`, never set as the Screen mounts: the iOS ScrollView draws the control ahead of its
  content, so toggling it remounts the page tree), and `footer`, the store (`createFooterStore`)
  the Screen sets its `footer` slot in. `ScreenFooter` draws that slot below the ScrollView, padded by
  `LowdefyPage`'s `bottomInset` (the shell's bottom safe area: tab bar, home indicator) and kept
  above the keyboard by a `KeyboardAvoidingView`; only it re-renders when the slot is set, so the
  Screen's every-render update does not render the page again. A block can draw its own chrome
  there instead (`useScreenFooter`, exported): AgentChat draws its composer in the footer while
  the conversation is the page content. A Screen with no footer slot leaves the footer alone, so
  a page uses one or the other. What onFocus has fired for is kept
  per page context (`getFocusMemory`, through `FocusMemoryContext`), not in the Screen's refs, so
  the page tree mounting again onto a kept context does not fire it again.
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
- A Screen's `backgroundTint` (`{ color, colorDark, height }`) is drawn by the page, not the
  Screen: the Screen sets it in `ScreenContext`'s `tint` store (`createTintStore`, as the footer
  store) and reports `backgroundTint: true`, and `PageTint` draws it as the `Animated.ScrollView`'s
  first content, absolutely at the top, behind the blocks, moved down by `scrollY` (native driver)
  so it stays fixed to the screen: behind the status bar, the bar, the large title and the search
  field, which the page scrolls under, and still while a large title collapses or the page is
  pulled to refresh. It is not drawn in a view around the scroll view: the native stack finds the
  page's scroll view by first subviews only (react-native-screens' `RNSScrollViewFinder`, as
  UIKit does), for the large title, the bar's scroll edge and the tab's scroll to top, so the
  scroll view must stay the page's first view, and each first child down to it a first view. A
  layer before it broke the large title and left `scrollY` at 0 at rest, which pinned a
  headerBottom a header height too low. `getBackgroundTint` picks `colorDark` in dark mode, reads
  a token or palette hue, and gives the top opacity (35% light, 45% dark); `getTintStops` eases it
  to clear along a half cosine, so the fade has no lower edge. A new tint is a new layer that
  fades in over 250ms on the native driver as the layers under it fade out and are dropped; the
  same tint set again (a page tree mounting again) changes nothing. The shell's router makes the
  bar clear over a tinted Screen on iOS (`headerTransparent`; before iOS 26 also clear at the
  scroll edge and the chrome material once scrolled) and counts the page as under the bar. A
  headerBottom at rest has no surface, so the tint shows through it; pinned, its surface (the
  grouped background, reaching up over the bar) draws a second `ScreenTint`, clipped, at
  `getHeaderBottomMotion`'s `tintOffset` (`cover + scrollY - translateY`, the scroll view's top
  in the surface, from where the strip is on screen), so it continues the page's tint with no
  seam while rows scrolled under it stay hidden.
- The engine's `window` and `document` keys hold plain objects. `focus` and `blur` have no
  source on a phone; `online` and `offline` follow the `network` the shell passes.

## Streamed server calls

React Native's `fetch` buffers a response body, so a block that reads its answer as a stream (the
native AgentChat reads the AI SDK's UI message stream, server-sent events over a POST) calls
`methods.streamFetch(path, init)`, a native-only block method (`block/createStreamFetch.js`). It
prefixes `lowdefy.apiBase` and adds the caller's session as the core's requests do
(`getAuthorizationHeaders`: a bearer host's token as `Authorization`), and calls
`host.streamFetch`, a Fetch API whose body streams. The shell gives `expo/fetch`, sent as its
`fetch` is (the `x-lowdefy-shell` header, no cookies, Lowdefy Dev's pairing token) and watched by
the same session watch, so a 401 ends the session.

## Tests

Jest runs with the `@react-native/jest-preset` (babel-jest and React Native's mocks) and
`@testing-library/react-native`, not the repository's ESM swc setup. `src/test/removeWindow.js`
deletes React Native's `window` alias, so a stray `window` read fails. Test blocks and a small
build-shaped page helper live in `src/test/`; `@lowdefy/build` does not load under the preset.
`intl-messageformat` and `@formatjs/*` ship ES modules and static class blocks, so the Jest config
transforms them, and Babel adds the static class block plugin.
