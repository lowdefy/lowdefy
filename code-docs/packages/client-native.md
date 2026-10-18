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
| `layout/layoutStyles.js`                                         | `layoutStyles(layout, breakpoint) → { container, child }`                    |
| `globals/createNativeGlobals.js`                                 | Host globals: route `location`, `Dimensions`, `AppState`, network events     |
| `link/setupLink.js`                                              | Page links through the host router, others through `Linking`                 |
| `screen/Screen.js`                                               | The `Screen` page type; reports header options to `onScreenOptions`          |
| `trace/describeBlock.js`                                         | The trace's element description, by block id                                 |

## Differences from the web renderer

- `visible: false` draws nothing (the web keeps a hidden `div` for its id).
- There are no class names, `Head`, shortcuts, progress bar or antd providers.
- `layoutStyles` is temporary. Percentage spans do not subtract a horizontal gap, so spans that
  share a line on the web wrap when an area sets one. `layout-native` replaces the
  implementation, not the interface.
- The engine's `window` and `document` keys hold plain objects. `focus` and `blur` have no
  source on a phone; `online` and `offline` follow the `network` the shell passes.

## Tests

Jest runs with the `@react-native/jest-preset` (babel-jest and React Native's mocks) and
`@testing-library/react-native`, not the repository's ESM swc setup. `src/test/removeWindow.js`
deletes React Native's `window` alias, so a stray `window` read fails. Test blocks and a small
build-shaped page helper live in `src/test/`; `@lowdefy/build` does not load under the preset.
`intl-messageformat` and `@formatjs/*` ship ES modules and static class blocks, so the Jest config
transforms them, and Babel adds the static class block plugin.
