# @lowdefy/e2e-utils

## 5.5.1

### Patch Changes

- @lowdefy/helpers@5.5.1

## 5.5.0

### Patch Changes

- @lowdefy/helpers@5.5.0

## 5.4.0

### Minor Changes

- f0fea51: feat(e2e-utils): Support list-child blocks in `ldf.block()` and add `ldf.list()` helper.

  Manifest now records list children under their templated id (`listId.$.childId`) by reading block category from `plugins/blockMetas.json`. At runtime `ldf.block()` falls back from the literal id to the template by replacing integer-only path segments with `$`, so `ldf.block('legal_rows.0.toggle').do.toggle()` resolves to the Switch helper without app authors writing raw `page.locator(...)`. `ldf.list(listId)` adds `.count()`, `.row(i)`, `.rowBy(key, value)` and `.rowWhere(predicate)` sugar.

### Patch Changes

- 134792b: fix: Unblock Playwright e2e for v5+ Lowdefy apps.

  **`@lowdefy/server-e2e`**

  - `next.config.js` now declares `turbopack: {}` and drops the legacy `webpack` polyfill block, so Next 16 (Turbopack-by-default) no longer errors with `This build is using Turbopack, with a webpack config and no turbopack config`. The `transpilePackages` list is now built from the same `build/blockPackages.json` artifact used by `@lowdefy/server`.
  - Plugin `types` modules are now correctly unwrapped from their ESM default export, so apps using custom plugins (blocks, actions, operators, connections, requests, etc.) no longer fail with `Action/Block/... type "Foo" was used but is not defined`.
  - Plugin `blockMetas` are now collected on the e2e server, matching the behaviour of `@lowdefy/server` and `@lowdefy/server-dev`.
  - `lowdefy build --server e2e` no longer crashes when the project has no `lowdefy.yaml` or `lowdefy.yml` (returns an empty plugin set instead of `YAML.parse(undefined)`).
  - Page and API routes now use catch-all segments (`pages/[[...pageId]].js`, `pages/api/endpoints/[...endpointId].js`, `pages/api/request/[...path].js`), so apps with nested page paths (e.g. `pages: [{ id: 'foo/bar' }]`) render correctly under `--server e2e` instead of returning 404.
  - `_app.js` and `_document.js` now mirror `@lowdefy/server`'s dark-mode handling — `useDarkMode` from `@lowdefy/client`, a `ThemeTokenResolver` that exposes the resolved antd token on `lowdefy.theme._resolvedAntdToken`, and a pre-hydration background-colour script that prevents the light/dark flash on page navigation.
  - `pages/api/client-error.js` now enforces the same-origin host check and strips `~e.received` from incoming payloads, matching `@lowdefy/server`.
  - `lowdefy/build.mjs` now uses `instanceof BuildError` for the formatted-error shortcut (matches `@lowdefy/server`) and drops the obsolete `mixin` logger config.
  - Runtime dependency set now includes `@lowdefy/blocks-antd-x`, and `tailwindcss` / `@tailwindcss/postcss` are declared in `dependencies` (not just `devDependencies`). The unused `process` browser polyfill has been removed.

  **`@lowdefy/e2e-utils`**

  - `extractBlockMap` now traverses `slots.<name>.blocks` alongside `areas.<name>.blocks` and `blocks`. Compiled page artifacts under `.lowdefy/server/build/pages/<pageId>.json` use the `slots` container shape, which `extractBlockMap` was not walking — so `generateManifest` produced a `blockMap` containing only the page root and `ldf.block('<any-nested-id>')` threw `Block "<id>" not found on page. Available blocks: <pageId>` for every non-root block, reducing the e2e framework to root-block assertions and raw `ldf.page.locator(...)` fallbacks.

  **`lowdefy` CLI**

  - `lowdefy build --server <name>` now re-fetches the server package when the version matches but the name differs. Both `lowdefy build` and `lowdefy build --server e2e` write to the same `.lowdefy/server/` directory, so the previous version-only cache check meant flipping between them (in either order) would silently reuse whichever server package was fetched first.

- Updated dependencies [25225ab]
- Updated dependencies [f11addd]
- Updated dependencies [0108f38]
  - @lowdefy/helpers@5.4.0

## 5.3.0

### Patch Changes

- @lowdefy/helpers@5.3.0

## 5.2.0

### Patch Changes

- @lowdefy/helpers@5.2.0

## 5.1.0

### Patch Changes

- @lowdefy/helpers@5.1.0

## 5.0.0

### Major Changes

- f430f02dde: Rename `areas` to `slots` throughout the framework.

  ### Breaking Changes

  - **`areas` renamed to `slots`**: All block area definitions use `slots` instead of `areas`. The build pipeline auto-migrates `areas` to `slots` with a deprecation warning in dev mode (error in production).
  - **Engine internals**: `Areas.js` renamed to `Slots.js`. Block instances expose `.slots` instead of `.areas`.
  - **Layout internals**: `layoutParamsToArea` renamed to `layoutParamsToSlot`.
  - **Custom blocks**: Blocks that render child areas must use `content.slotName()` — the API is unchanged but the terminology in config and docs is now `slots`.

### Patch Changes

- Updated dependencies [905d5d406]
  - @lowdefy/helpers@5.0.0

## 4.7.3

### Patch Changes

- @lowdefy/helpers@4.7.3

## 4.7.2

### Patch Changes

- @lowdefy/helpers@4.7.2

## 4.7.1

### Patch Changes

- ce1194081: fix(e2e-utils): Use domcontentloaded for page navigation.

  Page navigation now uses `waitUntil: 'domcontentloaded'` instead of the default `load` event. This prevents hangs on pages with WebSocket connections or slow-loading resources, since the Lowdefy client readiness check is already a stronger signal.

- ab28590fb: refactor(e2e-utils): Update scaffold env vars and simplify init.

  Renamed `MDB_E2E_URI` to `LOWDEFY_E2E_MONGODB_URI` in scaffold templates to align with the new `LOWDEFY_E2E_SECRET_*` override pattern. The init script no longer runs install automatically — dependencies are added to `package.json` and the user is prompted to install.

  - @lowdefy/helpers@4.7.1

## 4.7.0

### Minor Changes

- 356de36b6: feat(e2e-utils): Add ldf.api() assertions for API endpoint testing

  - New `api.js` core module with `getApiState`, `getApiResponse`, `expectApi` functions
  - Reads from `window.lowdefy.apiResponses[endpointId][0]` (mirrors request pattern)
  - `ldf.api(endpointId).expect.toFinish()` — wait for API call completion
  - `ldf.api(endpointId).expect.toHaveResponse(response)` — assert response
  - `ldf.api(endpointId).expect.toHavePayload(payload)` — assert sent payload
  - `ldf.api(endpointId).response()` — get raw response value
  - `ldf.api(endpointId).state()` — get full API state object
  - `ldf.mock.api()` now captures payloads for assertion
  - `ldf.mock.getCapturedApi(endpointId)` — retrieve captured API data

### Patch Changes

- a41f6d2ab: feat(e2e-utils): Improved e2e scaffold with new scripts and SLOW_MO support.

  **New scaffold scripts:**

  - `e2e:headed` — Run tests with a visible browser in slow motion (`SLOW_MO=500`, `--workers=1`)
  - `e2e:server` — Start the e2e server once, then rerun tests without rebuilding

  **SLOW_MO env var:**

  - `createConfig` now reads the `SLOW_MO` environment variable and passes it to Playwright's `launchOptions.slowMo`
  - No manual config extension needed — just set `SLOW_MO=500` in your npm script

  **Scaffold template fixes:**

  - Fixed `appDir` from `'../'` to `'./'` — `path.resolve` resolves relative to cwd, not the config file
  - Fixed `fixtures.js` template to use `mdbFixtures` (plural) from `/fixtures` subpath with `mergeTests`
  - Simplified `example.spec.js` to use `/api/auth/session` health check — works on auth-protected apps
  - Fixed README template with correct `appDir` values, "Faster Test Runs" section, and "Common Patterns" section

- 811f80760: fix(e2e-utils): Escape dotted block IDs in e2e CSS selectors.

  Block IDs containing dots (e.g., `form.field.name`) now work correctly in e2e test locators. Added `escapeId()` utility to `@lowdefy/e2e-utils` that escapes CSS special characters, and updated all block e2e helpers and test specs to use it.

- Updated dependencies [4543688f7]
- Updated dependencies [dea6651a1]
  - @lowdefy/helpers@4.7.0

## 4.6.0

### Minor Changes

- 5e03091ee: Add e2e testing package for Lowdefy apps

  **@lowdefy/e2e-utils** (new package)

  - Locator-first API via `ldf` Playwright fixture: `ldf.block('id').do.*`, `ldf.block('id').expect.*`
  - Request mocking with static YAML files (`mocks.yaml`) and inline per-test overrides
  - Request assertion API: `ldf.request('id').expect.toFinish()`, `.toHaveResponse()`, `.toHavePayload()`
  - State and URL assertions: `ldf.state('key').expect.toBe()`, `ldf.url().expect.toBe()`
  - Manifest generation from build artifacts for block type resolution and helper loading
  - `createConfig()` and `createMultiAppConfig()` for Playwright config with automatic build/server management
  - Scaffold command (`npx @lowdefy/e2e-utils`) for project setup with templates and dependency management
  - Block helper factory with auto-provided expect methods (visible, hidden, disabled, validation)

  **@lowdefy/cli**

  - Add `--server` option to `lowdefy build` for server variant selection (e.g., `--server e2e`)

  **@lowdefy/client**

  - Expose `window.lowdefy` when `stage="e2e"` for e2e state/validation access

  **@lowdefy/blocks-antd**

  - Flatten e2e helper APIs for polymorphic proxy compatibility
  - Add TextArea e2e helper

  **@lowdefy/block-dev-e2e**

  - Remove unused srcDir variable

### Patch Changes

- Updated dependencies [aa0d6d363e]
- Updated dependencies [aebca6ab51]
- Updated dependencies [ab19b1bb77]
- Updated dependencies [8ec5f1be05]
  - @lowdefy/helpers@4.6.0
