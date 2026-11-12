# @lowdefy/operators-cron

## 7.2.0

### Patch Changes

- Updated dependencies [31d7de8]
- Updated dependencies [dd5c2b1]
- Updated dependencies [61ae799]
- Updated dependencies [bb7c249]
- Updated dependencies [3cd6d62]
- Updated dependencies [3af2019]
- Updated dependencies [b1d42ca]
  - @lowdefy/helpers@7.2.0
  - @lowdefy/operators@7.2.0

## 7.1.0

### Patch Changes

- @lowdefy/operators@7.1.0
- @lowdefy/helpers@7.1.0

## 7.0.0

### Minor Changes

- 81bd4f0: feat(operators-cron): new `@lowdefy/operators-cron` package with the `_cron` operator

  Work with cron expressions in app config, on the client and the server. `_cron.next` and
  `_cron.previous` return the occurrences of a cron expression as dates, from a given date and
  in a given timezone, with `count` (up to 1000) returning an array of occurrences.
  `_cron.describe` renders an expression as a human readable sentence in any cronstrue locale,
  `_cron.validate` tests whether an expression is valid without ever throwing, and `_cron.fields`
  returns the parsed fields of an expression.

  All methods share one set of rules: blank expressions count as missing, the `H` hash token is
  rejected (it would pick a random time on every evaluation), expressions that never occur are
  invalid, and `from` must be a date or an ISO 8601 date string.

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
