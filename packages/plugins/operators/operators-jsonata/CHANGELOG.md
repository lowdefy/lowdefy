# @lowdefy/operators-jsonata

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

- a1ca6d6: chore(operators-jsonata): Bump `jsonata` to 1.8.9 to clear four security advisories (GHSA-66mm-25pp-rfff, GHSA-2943-5xfg-gq5f, GHSA-8gq3-vp5j-2grp, GHSA-86vw-mfpg-wwv9).
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
- @lowdefy/helpers@5.1.0

## 5.0.0

### Major Changes

- f430f02dde: Replace auto-generated `types.json` with source `types.js` files in all plugin packages.

  ### Breaking Changes

  - **Plugin type resolution**: Plugin types are now read from source `types.js` files instead of auto-generated `types.json`. Block packages derive types from their `metas.js` barrel using the `extractBlockTypes` helper.
  - **`extract-plugin-types` script removed**: The build-time extraction script in `@lowdefy/node-utils` has been deleted. Each plugin package maintains its own `types.js`.

### Patch Changes

- Updated dependencies [905d5d406]
  - @lowdefy/helpers@5.0.0
  - @lowdefy/operators@5.0.0

## 4.7.3

### Patch Changes

- @lowdefy/operators@4.7.3
- @lowdefy/helpers@4.7.3

## 4.7.2

### Patch Changes

- @lowdefy/operators@4.7.2
- @lowdefy/helpers@4.7.2

## 4.7.1

### Patch Changes

- @lowdefy/operators@4.7.1
- @lowdefy/helpers@4.7.1

## 4.7.0

### Patch Changes

- Updated dependencies [4543688f7]
- Updated dependencies [dea6651a1]
  - @lowdefy/operators@4.7.0
  - @lowdefy/helpers@4.7.0

## 4.6.0

### Minor Changes

- aa0d6d363e: feat: Config-aware error tracing and Sentry integration

  **Config-Aware Error Tracing (#1940)**

  - Errors now trace back to exact YAML config locations with file:line
  - Clickable VSCode links in terminal and browser
  - Build-time validation catches typos with "Did you mean?" suggestions
  - Service vs Config error classification

  **Plugin Error Refactoring**

  - Operators throw simple error messages without formatting
  - Parsers (WebParser, ServerParser, BuildParser) format errors with received value and location
  - Removed redundant "Operator Error:" prefix from error messages
  - Consistent error format: "{message} Received: {params} at {location}."
  - Actions and connections also simplified: removed inline `received` from error messages (interface layer adds it)
  - Connection plugins (axios-http, knex, redis, sendgrid) no longer expose raw response data in errors

  **Error Class Hierarchy**

  - Unified error system in `@lowdefy/errors` with all error classes
    - `@lowdefy/errors/build` - Build-time classes with sync location resolution
  - Error classes: `LowdefyError`, `ConfigError`, `ConfigWarning`, `PluginError`, `ServiceError`
  - `ConfigWarning` supports `prodError` flag to throw in production builds
  - `ServiceError.isServiceError()` detects network/timeout/5xx errors
  - `~ignoreBuildChecks` cascades through descendants to suppress warnings/errors

  **Build Error Collection**

  - Errors collected in `context.errors[]` instead of throwing immediately
  - `tryBuildStep()` wrapper catches and collects errors from build steps
  - All errors logged together before summary message for proper ordering

  **Sentry Integration (#1945)**

  - Zero-config Sentry support - just set SENTRY_DSN
  - Client and server error capture with Lowdefy context (pageId, blockId, config location)
  - Configurable sampling rates, session replay, user feedback
  - Graceful no-op when DSN not set

### Patch Changes

- bb3222a5a: fix(errors): Preserve error cause chains in catch-and-rethrow blocks across plugins and CLI
- Updated dependencies [aa0d6d363e]
- Updated dependencies [aebca6ab51]
- Updated dependencies [ab19b1bb77]
- Updated dependencies [8ec5f1be05]
  - @lowdefy/helpers@4.6.0
  - @lowdefy/operators@4.6.0

## 4.5.2

### Patch Changes

- @lowdefy/operators@4.5.2
- @lowdefy/helpers@4.5.2

## 4.5.1

### Patch Changes

- @lowdefy/operators@4.5.1
- @lowdefy/helpers@4.5.1

## 4.5.0

### Minor Changes

- 09ae496d8: Add JSONata operator.

### Patch Changes

- Updated dependencies [09ae496d8]
  - @lowdefy/operators@4.5.0
  - @lowdefy/helpers@4.5.0
