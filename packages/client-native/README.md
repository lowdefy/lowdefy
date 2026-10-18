# @lowdefy/client-native

The React Native renderer for Lowdefy pages. It draws a page as native views over
`@lowdefy/client-core` and `@lowdefy/engine`, which run the page's state, operators, actions and
requests as they do on the web.

```jsx
<LowdefyPage
  core={{ lowdefy, apiBase, basePath, auth }}
  host={host}
  pageConfig={pageConfig}
  rootConfig={rootConfig}
  types={{ blocks, actions, operators }}
  pathParams={pathParams}
  onScreenOptions={(options) => navigation.setOptions(options)}
/>
```

- `host` is the `@lowdefy/client-core` host. Build its `globals` with `createNativeGlobals`, so
  the engine reads the shown route as `location`, the window size from `Dimensions` and app
  visibility from `AppState`.
- Each block component in `types.blocks` carries its `meta`, as web blocks do.
- Every block's view has its block id as `testID` and `accessibilityLabel`.
- `rootConfig` carries the mobile root's `theme` (`{ darkMode, light, dark }`, antd's computed
  tokens per mode) and `classMap` (the Tailwind class map). In dev a page built on request carries
  `_classMap`, its own classes' entries, which go over the root's.
- `types.icons` is the icon data `components.Icon` draws from, read at render. Each built mobile
  page carries its icons' data as `_icons`; the shell adds it to `types.icons` before the page
  renders.
- Areas and blocks are laid out by `layoutStyles(layout, breakpoint, columnGap)` from
  `@lowdefy/layout-native`, v7's 24-column grid as React Native styles.
- Each block gets `styles`, a React Native style per slot: its classes from the class map, then
  its `style`. A block puts its own defaults and `useTheme().tokens` under them.
- Wrap the app's pages in `<ThemeProvider host storageKey theme>` so they share the theme mode;
  `SetDarkMode` and `_media: darkMode` work as on the web. A page outside one makes its own.
- A `Screen` page reports `{ title, presentation, headerRight }` through `onScreenOptions`, for
  the shell's router to draw the header. Its `headerBottom` slot is drawn on the page, pinned
  under the header as the page scrolls; pass `headerInset`, where the header's bottom edge is in
  the page's scroll view (an Animated header height when the page scrolls under a translucent
  header, 0 when it sits below it).
- A Screen's `backgroundTint` (`{ color, colorDark, height }`) is drawn by the page in its scroll
  view, behind the blocks and fixed to the screen's top: behind the header (the Screen reports
  `backgroundTint: true`, for the router to make the bar clear) and in a pinned headerBottom's
  surface. It cross-fades when it changes. The scroll view stays the page's first view.

The package imports no Expo modules: a shell passes what it needs through the host.
