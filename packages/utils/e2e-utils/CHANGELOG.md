# @lowdefy/e2e-utils

## 6.0.0

### Major Changes

- 8a82fb0: feat!: Replace Next.js with Vite + Hono.

  Lowdefy servers no longer run on Next.js. The production server is a
  [Hono](https://hono.dev) app serving a [Vite](https://vite.dev)-built React
  client; the dev server runs Vite with the Hono app mounted as middleware,
  giving instant hot module replacement for plugin changes (~700ms instead of
  the previous 20–40s rebuild-and-restart cycle). Authentication moves from
  NextAuth v4 to the Auth.js v5 engine (`@auth/core` via `@hono/auth-js`) with
  the `auth:` YAML schema unchanged.

  **Your YAML config does not change.** `lowdefy build`, `lowdefy dev` and
  `lowdefy start` work as before.

  Breaking changes:

  - **Auth sessions invalidate once on upgrade.** The session cookie prefix
    changes from `next-auth.*` to `authjs.*` — users sign in again after the
    upgrade. Provider, adapter, callback and event configuration is unchanged.
  - **`NEXTAUTH_SECRET` is removed — rename it to `AUTH_SECRET`.** The build
    fails with a config error when auth providers are configured and
    `AUTH_SECRET` is not set. `NEXTAUTH_URL` still works as an Auth.js
    fallback, but `AUTH_URL` is the preferred name.
  - **Custom `next.config.js` files no longer apply.** Customize the client
    build with a `vite.config.js` in the server directory instead.
  - **`LOWDEFY_BUILD_OUTPUT_STANDALONE` is removed.** `lowdefy build` writes a
    complete runnable server to `.lowdefy/server` — copy that folder (or build
    in Docker) and run `node src/index.js`. See the updated Docker and node
    server deployment docs.
  - **`NEXT_PUBLIC_SENTRY_DSN` is removed.** Set `SENTRY_DSN` on the server —
    it is passed to the browser client at runtime, so rotating it no longer
    requires a rebuild. Source maps upload via `@sentry/vite-plugin` when
    `SENTRY_AUTH_TOKEN` is set.
  - **Page navigation is now client-side (SPA).** The first page load embeds
    config in the HTML; navigating fetches page config from `/api/page/*`
    without a full browser reload.

### Minor Changes

- ea4de26: feat: Live state x-ray, state & data checkpoints, request execution, and app map for AI agents

  The dev server's agent toolbelt grows from discovery and build feedback to full runtime visibility — 23 MCP tools total at `/lowdefy-docs/mcp`.

  **Live state x-ray (`@lowdefy/server-dev`)**

  - `lowdefy_inspect_state`: read the ACTUAL state, request results, and event log of a running page. When you have the page open in your browser it reads your live tab — reproduce a bug by clicking through the app, then let the agent look at exactly what you see. Falls back to a headless run otherwise.
  - `lowdefy_eval_operator`: evaluate any operator expression (like `{"_state": "customer.name"}`) against live page state — a REPL for config, running in the real browser runtime.

  **State & data checkpoints**

  - `lowdefy_snapshot_state` captures a page's state and every request's recorded response into a committable `checkpoints/<name>/` folder — one file per part, one file per request, easy to review in git.
  - `lowdefy_load_state` puts the app back into that state: recorded request data is served by the dev server automatically, and `?_checkpoint=<name>` on any page URL restores the state in a normal browser tab — hand a teammate a URL that opens the app mid-scenario.
  - `lowdefy_checkpoint_to_mocks` converts a checkpoint into `@lowdefy/e2e-utils` `mocks.yaml` fixtures for e2e tests.
  - `lowdefy_checkpoint` / `lowdefy_revert_checkpoint` snapshot and restore config files around risky edits.

  **Request execution and app understanding**

  - `lowdefy_run_request` executes a request with a test payload to verify data shape. Read-only types always run; write requests need `cli.agentTools.allowWriteRequests: true` in lowdefy.yaml (dev-only opt-in).
  - `lowdefy_app_map`: every page, menu, connection, endpoint, and agent in one call — onboard to a large app instantly.

  **@lowdefy/e2e-utils**

  - New `@lowdefy/e2e-utils/runtime` export: the runner-agnostic surface (navigation, state/request getters, mocking, page manager) usable outside the Playwright test runner. Assertions moved to `src/assertions/` — the package's public API is unchanged.
  - Fixed `setState` silently doing nothing — it now uses the engine's real state primitives.

- 519163c: Add `getShortcutModifier` for testing `mod` keyboard shortcuts.

  A `mod` shortcut resolves to Cmd or Ctrl from the platform the browser reports, and Playwright emulates that platform per project — a Desktop Chrome project reports Windows even when the test runner is on macOS. A test that derives the key from `process.platform` therefore presses a key the app is not listening for, and only on some host operating systems.

  `getShortcutModifier(page)` reads the platform from the page instead, so the key a test presses is always the key the app is listening for:

  ```javascript
  import { getShortcutModifier } from '@lowdefy/e2e-utils';

  const mod = await getShortcutModifier(page);
  await page.keyboard.press(`${mod}+k`);
  ```

### Patch Changes

- a783370: fix: Set urlQuery through the app router.

  `ldf.urlQuery('key').do.set(value)` called `history.pushState` directly, which changed the URL without notifying the Lowdefy router. The page config was never re-fetched, so a Dynamic page kept showing content resolved from the previous query and tests asserting on the update failed.

  `do.set` now navigates through the app's router — the same path a `Link` or `SetUrlQuery` action takes. On a Dynamic page it waits for the engine to rebuild the page context from the newly resolved config, so a following assertion or `value()` read cannot see content resolved from the previous query.

- Updated dependencies [6446ae6]
  - @lowdefy/helpers@6.0.0

## 5.6.0

### Patch Changes

- b09ad62: fix: Allow dependency build scripts via pnpm-workspace.yaml so installs succeed on pnpm 11.

  `lowdefy dev` and `lowdefy build` failed with `Dependency installation failed.` on pnpm 11 (`ERR_PNPM_IGNORED_BUILDS`), because dependency build scripts (sharp, better-sqlite3) were only allowed via the `pnpm.onlyBuiltDependencies` field in the server package.json — a field pnpm no longer reads (and strips at publish), while pnpm 11 turns ignored build scripts into a hard install error. The CLI now writes a `pnpm-workspace.yaml` with the build allowlist into the server directory before installing, covering pnpm 9 (`packages`), pnpm 10 (`onlyBuiltDependencies`), and pnpm 10.29+/11 (`allowBuilds`). An existing file is never overwritten, so users can extend the allowlist for their own plugins' native dependencies. When the app lives inside a pnpm workspace (e.g. `apps/*/.lowdefy/*` in the workspace globs, plugins pinned as `workspace:*`), the CLI writes nothing — the server installs as part of the parent workspace, where isolating it would break `workspace:*` plugin resolution and the root's `overrides`/`packageExtensions`, and build allowlists belong in the workspace root's `pnpm-workspace.yaml`. `lowdefy-e2e init` used the same dead mechanism for mongodb-memory-server and now writes the same allowlist to `pnpm-workspace.yaml` (the workspace root's if the app is inside a workspace, otherwise a new file in the app directory). The dead `pnpm` fields were removed from the server packages. Fixes #2191.

- Updated dependencies [3ead269]
- Updated dependencies [79bbd84]
- Updated dependencies [824f4be]
- Updated dependencies [824f4be]
- Updated dependencies [3ead269]
- Updated dependencies [1a6223f]
- Updated dependencies [3ead269]
  - @lowdefy/helpers@5.6.0

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
