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
- Areas are laid out by `layoutStyles(layout, breakpoint) → { container, child }`, a temporary
  row and column flex layout.
- A `Screen` page reports `{ title, presentation, headerRight }` through `onScreenOptions`, for
  the shell's router to draw the header.

The package imports no Expo modules: a shell passes what it needs through the host.
