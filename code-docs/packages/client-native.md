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
| `link/setupLink.js`                                              | Page links through the host router, others through `Linking`                 |
| `screen/Screen.js`                                               | The `Screen` page type; reports header options to `onScreenOptions`          |
| `trace/describeBlock.js`                                         | The trace's element description, by block id                                 |
| `elements/createElementRegistry.js`, `useElementRef.js`          | Native views by page and block id (`globals.elements`), for native actions   |
| `icon/Icon.js`                                                   | Draws IconData (the web's icon node data) with `react-native-svg`            |
| `icon/createIcon.js`                                             | `components.Icon`: an icon by name from `types.icons`, drawn with `Icon`     |

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
  page renders.
- The engine's `window` and `document` keys hold plain objects. `focus` and `blur` have no
  source on a phone; `online` and `offline` follow the `network` the shell passes.

## Tests

Jest runs with the `@react-native/jest-preset` (babel-jest and React Native's mocks) and
`@testing-library/react-native`, not the repository's ESM swc setup. `src/test/removeWindow.js`
deletes React Native's `window` alias, so a stray `window` read fails. Test blocks and a small
build-shaped page helper live in `src/test/`; `@lowdefy/build` does not load under the preset.
`intl-messageformat` and `@formatjs/*` ship ES modules and static class blocks, so the Jest config
transforms them, and Babel adds the static class block plugin.
