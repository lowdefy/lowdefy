# @lowdefy/operators-dayjs

## 7.1.0

### Patch Changes

- @lowdefy/operators@7.1.0
- @lowdefy/helpers@7.1.0

## 7.0.0

### Patch Changes

- badaa49: Pages re-evaluate only the blocks whose inputs changed.

  Every change - a keystroke, SetState, a request completing - used to re-evaluate every block on the page. The engine now records what each block reads (the state paths, requests, globals and other values its operators read) and re-evaluates only the blocks whose reads changed. Values that change without notice - the clock, the URL, window size, randomness - keep their blocks evaluating on every update, exactly as before. On the docs app and a large production app, a keystroke evaluates 6-8x fewer blocks overall (from all blocks on a page to a handful), with identical output.

  - Every core operator declares how it reads (`tracking`); an operator without a declaration keeps its blocks evaluating every time, so third-party plugins keep working unchanged.
  - `_js` functions that use the clock, randomness or browser globals are detected at build and treated as always changing.
  - Set `config.dependencyTracking: false` in `lowdefy.yaml` to evaluate every block on every update as before.

- a9442cc: Production pages load only the plugin code they use.

  The production client used to ship every block, action, operator and icon the app uses anywhere in one main bundle, and every first visit downloaded all of it. Now the build writes one small module per distinct page type set, and each page loads its own. On the docs app the main bundle drops from 6,016 kB to 1,021 kB (1,778 kB to 332 kB gzipped). A simple page's first load drops from 1,720 kB to 529 kB gzipped.

  - The HTML preloads the page's chunks alongside the main bundle, so the first page does not wait an extra round trip.
  - Content-hashed assets are served with `Cache-Control: public, max-age=31536000, immutable`, on the Node server and in `lowdefy vercel-output`.
  - Lowdefy's plugin packages declare `"sideEffects": ["**/*.css"]`, so a page that uses one block no longer loads the whole package.
  - The build adds the types a page runs without naming them: the operators the `_js` accessors call, and the actions and operators a block runs for events it registers itself (such as `Request` in `Upload` or `SetLocale` in `PageHeaderMenu`), which blocks list in `meta.actions` and `meta.operators`. Plugin blocks that register their own events should list them the same way.
  - A Dynamic block whose content uses a type its `properties.types` did not declare still works: the page loads the full type set and the server logs a warning naming the type to declare.

  No config changes. The dev server is unchanged.

- Updated dependencies [b3ba6fb]
- Updated dependencies [f7fa621]
- Updated dependencies [099d412]
- Updated dependencies [6144814]
- Updated dependencies [db1a4d3]
- Updated dependencies [81a5ad3]
- Updated dependencies [91740e6]
- Updated dependencies [2595439]
- Updated dependencies [badaa49]
- Updated dependencies [f9e483f]
- Updated dependencies [d2c8e01]
- Updated dependencies [f889c26]
- Updated dependencies [bfc6a00]
- Updated dependencies [b226c43]
- Updated dependencies [239a3a7]
- Updated dependencies [1766343]
- Updated dependencies [959ec32]
- Updated dependencies [a34939d]
- Updated dependencies [e6302c6]
- Updated dependencies [1f58d7f]
- Updated dependencies [aa6bb38]
- Updated dependencies [81bd4f0]
- Updated dependencies [5017abe]
  - @lowdefy/operators@7.0.0
  - @lowdefy/helpers@7.0.0

## 6.1.0

### Patch Changes

- Updated dependencies [6d6f8fa]
- Updated dependencies [5657441]
- Updated dependencies [6d6f8fa]
  - @lowdefy/operators@6.1.0
  - @lowdefy/helpers@6.1.0

## 6.0.0

### Patch Changes

- Updated dependencies [60401aa]
- Updated dependencies [efd1967]
- Updated dependencies [6446ae6]
- Updated dependencies [982a3db]
  - @lowdefy/operators@6.0.0
  - @lowdefy/helpers@6.0.0

## 5.6.0

### Patch Changes

- Updated dependencies [3ead269]
- Updated dependencies [79bbd84]
- Updated dependencies [824f4be]
- Updated dependencies [824f4be]
- Updated dependencies [3ead269]
- Updated dependencies [1a6223f]
- Updated dependencies [3ead269]
  - @lowdefy/helpers@5.6.0
  - @lowdefy/operators@5.6.0

## 5.5.1

### Patch Changes

- @lowdefy/operators@5.5.1
- @lowdefy/helpers@5.5.1

## 5.5.0

### Patch Changes

- @lowdefy/operators@5.5.0
- @lowdefy/helpers@5.5.0

## 5.4.0

### Patch Changes

- Updated dependencies [60401aa]
- Updated dependencies [25225ab]
- Updated dependencies [f11addd]
- Updated dependencies [0108f38]
- Updated dependencies [302e330]
  - @lowdefy/operators@5.4.0
  - @lowdefy/helpers@5.4.0

## 5.3.0

### Patch Changes

- @lowdefy/operators@5.3.0
- @lowdefy/helpers@5.3.0

## 5.2.0

### Patch Changes

- Updated dependencies [73fa2b9]
- Updated dependencies [1e964c4]
  - @lowdefy/operators@5.2.0
  - @lowdefy/helpers@5.2.0

## 5.1.0

### Patch Changes

- @lowdefy/operators@5.1.0

## 5.0.0

### Major Changes

- 155c0b9724: Replace moment.js with day.js across the monorepo.

  ### Breaking Changes

  - **`_moment` operator removed**: Use `_dayjs` instead. The new `@lowdefy/operators-dayjs` package provides the `_dayjs` operator with the same API patterns.
  - **`@lowdefy/operators-moment` package removed**: Apps using `_moment` must migrate to `_dayjs`.
  - **Nunjucks `date` filter**: Now uses day.js internally. Format strings are day.js compatible (mostly identical to moment).
  - **Date picker blocks**: All date/time picker blocks use day.js instead of moment for value parsing and formatting.
  - **Google Sheets connection**: Date serialization uses day.js internally.
  - **`humanizeDuration` thresholds**: The `thresholds` parameter on `_dayjs.humanizeDuration` is silently ignored (day.js does not support it).
  - **AgGrid cell renderers**: Update `__moment` to `__dayjs` in custom AG Grid cell renderer references.
  - **Date selector UTC handling**: Antd v6 bundles its own dayjs without the UTC plugin. Date selector blocks wrap antd's dayjs instances with the extended dayjs before calling `.utc()` — this is handled internally and requires no user action.

### Patch Changes

- @lowdefy/operators@5.0.0
