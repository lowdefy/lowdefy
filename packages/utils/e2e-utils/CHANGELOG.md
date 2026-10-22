# @lowdefy/e2e-utils

## 7.0.0

### Minor Changes

- 6dc9114: feat: Page routes match request paths to pages

  - The HTML page route and `/api/page/*` take the request path and match it to a page, so a page with a `path` pattern such as `{space}/tickets/{ticket_id}` is served at `/support/tickets/1234`. A page without `path` is still served at its id, so `/api/page/{pageId}` keeps working.
  - `/` (home) and `/404` stay fixed routes ahead of the matcher. When `homePageId` is unset, `/` redirects to the first menu link's URL built with its `pathParams`; a configured home page with a fixed `path` is served at `/`.
  - The first-load payload and the `/api/page/*` response carry `pageId`, `pathParams` and `matchedPath` (the matched path without `basePath` or one trailing `/`) next to `pageConfig`.
  - The sign-in and two-factor enrolment `callbackUrl` is the requested path plus query on every route; the `/api/page/*` sign-in redirect used to drop the query.
  - The dev server matches the path against the route table, JIT-builds the matched page, and returns `{ pageId, pathParams, matchedPath, pageConfig }`.
  - In `@lowdefy/e2e-utils`, `goto` and `waitForPage` take `{ pageId, path, pathParams, urlQuery }` and build the URL under the app's `basePath`; a string target is used as written. The ready check and the state, request, validation and `setUrlQuery` helpers read the page instance on screen, so a patterned page's instances are told apart.

- ae3541c: feat: Lowdefy servers stop when whatever started them stops

  A Lowdefy server started by a test runner, a script or a coding agent's command could outlive it when that process was killed or timed out, and keep holding a few hundred megabytes of memory for days. Servers now stop with their owner, however it ends.

  - **`lowdefy start`, `lowdefy dev` and `lowdefy test`** start the server with node directly (no `pnpm run start` in between), forward SIGINT, SIGTERM and SIGHUP to it, and hold its stdin, so the server stops even when the CLI is killed outright. The dev server's Vite process stops when the dev manager is killed. A server run directly with `node`, as in a Docker image or on Vercel, behaves as before.
  - **`--exit-with-pid <pid>`** on `lowdefy start` and `lowdefy dev`, or the `LOWDEFY_EXIT_WITH_PID` environment variable, stops the server when that process exits. The variable passes through wrappers such as `pnpm exec`, `npx` or a secrets manager.
  - **Test tools set it for you.** The Playwright configs from `@lowdefy/e2e-utils` and `@lowdefy/block-dev-e2e` tie the server to the Playwright run, so a killed or timed-out run leaves no server behind.
  - **`startServer`** from `@lowdefy/e2e-utils/startServer` builds and starts an app's e2e server for other test runners (a vitest or Jest `globalSetup`) and scripts, tied to the calling process, and returns `stop()`.
  - **`@lowdefy/e2e-utils` no longer reuses a running server by default.** A server left on the port would serve an old build to new tests. Set `LOWDEFY_E2E_REUSE_SERVER=true` to reuse one (for example after `pnpm e2e:server`), and `LOWDEFY_E2E_PORT` to move a run to another port.
  - **`lowdefy hub ps`** lists the Lowdefy servers running on the machine and the process that owns each. **`lowdefy hub prune`** lists the servers whose owner is gone, and `--kill` stops them. It also finds servers kept running by a `lowdefy` CLI whose own starter was killed (such as a `pnpm exec` wrapper killed outright) and servers left running by older Lowdefy versions (including a dev server's Vite process left behind by a killed dev server), and never stops a server whose owner is alive and still has its own starter, or one run as a launchd or systemd service. Servers record themselves in `~/.lowdefy/servers` (moved by `LOWDEFY_HOME`), and the hub prunes servers whose owner is gone each time it starts. On Windows, servers are identified by their process creation time, so `prune` works there for servers that record themselves.

### Patch Changes

- 81a5ad3: Client navigation by path. The production, e2e and dev clients fetch pages by URL path and learn the page id and path values from the server. Each set of path values is its own page instance: `Client` keys the page tree by the instance key, so following a link from one ticket to another remounts the page, and passes `pathParams` to the page context. The engine keeps up to 10 instances per page and gives actions `getPathParams`. The shown page is written to the path memory before its context is built, and auth callbacks write their target before navigating. A navigation to the path the shown page was matched on skips the fetch, unless the page is dynamic. The router's location carries the path instead of a page id. `setUrlQuery` waits for a page refetch only on dynamic pages.
- eab310c: fix(e2e-utils): Reuse a running server only when it is this app's e2e build

  `createConfig` and `createMultiAppConfig` reused any server that answered on the test port,
  so `pnpm e2e` could silently run against `lowdefy dev`, a production build, or the e2e
  server of another app or git worktree, where request mocks and the e2e session do not
  apply. The e2e server now answers `GET /api/e2e/identity` with the build directory it
  serves, and a Playwright global setup compares it with the app's build directory before
  any test runs. Any other server on the port stops the run with an error that names the
  port. Reusing this app's own e2e server (for example one started with `pnpm e2e:server`)
  still skips the build. Configs that extend the base config keep the check as long as they
  keep its `globalSetup`.

- 2746b40: chore(e2e-utils): Mark the `@playwright/test` peer dependency optional — the `./runtime` subpath does not use it, so `@lowdefy/server-dev` can drive pages through `playwright-core` without installing the test runner.
- 81bd4f0: feat(plugin-posthog): new PostHog product analytics plugin

  A default plugin that wraps the `posthog-js` browser SDK, so no script tag or snippet is
  needed. `posthog-js` is loaded lazily by `PostHogInit`, so an app with `enabled: false`
  never downloads it. Run `PostHogInit` from the app's root `events.onInitAsync`, which runs
  once per app load on whichever page opens first; repeat calls with the same `apiKey` do nothing.

  Adds `PostHogInit`, `PostHogCapture`, `PostHogPageview`, `PostHogCapturePageLeave`,
  `PostHogIdentify`, `PostHogSetPersonProperties`, `PostHogAlias`, `PostHogGroup`,
  `PostHogReset`, `PostHogOptIn`, `PostHogOptOut`, `PostHogFeatureFlag` and
  `PostHogReloadFeatureFlags`, each with a params schema.

  With PostHog disabled every other action is a silent no-op, so analytics can never break an
  app, but invalid params still throw and an action that runs before `PostHogInit` logs a
  console warning. `PostHogIdentify` reads the identity `posthog-js` holds and resets before
  identifying a different person on a shared browser.

  - **Lowdefy semantics** — every event gets `lowdefy_page_id` (the page id, also on a page with a
    path pattern) and `lowdefy_path_params` (the page's path values, `{}` without a pattern).
    Autocaptured clicks, rage clicks and dead clicks also get `lowdefy_block_id`,
    `lowdefy_block_type`, `lowdefy_block_ids`, `lowdefy_option` on a dropdown option, `lowdefy_row`
    and `lowdefy_column` inside a grid, and `lowdefy_text`: the text of the control the click
    reached (a button, menu item, option or label), even when the click lands on its icon, a child
    or a wrapper.
  - **Event failures** — a `lowdefy_event_failed` event is captured when a block or app event fails,
    with ids only, never messages or values, and at most 50 per app load. Failures in the app's
    `onInit` are captured too, although `PostHogInit` runs later in `onInitAsync`. Set
    `captureEventFailures: false` on `PostHogInit` to turn it off.
  - **Click text masking** — on by default. Click text (`$el_text`, `lowdefy_text`, `text` entries in
    `$elements_chain` and `$elements`, `$selected_content` and link targets) is kept only when the
    config of the page it was clicked on, the menus, the i18n messages or the antd locale spell it
    out. Grid and table cell values, options and menu items filled by requests, labels built from
    records and `Dynamic` block output are removed; button, menu, tab, column header and literal
    option labels stay. Element attributes other than structural ones (tag, classes, `class`,
    `role`, `type`, `row-index`, `col-id`, `nth-child`, `nth-of-type`) are removed, including
    `title`, `aria-label` and `data-*`, and `id` is kept only as a block wrapper id. Classes and
    `data-ph-capture-attribute-*` values are not masked, so apps must not build them from data. URLs
    are not masked. Set `maskDataText: false` on `PostHogInit` to send full click text, or
    `options.mask_all_text: true` to send none.
  - **Deployment environments** — `PostHogInit` registers the current environment as the
    `environment` super property on every event, and `posthog.enabled: false` in an environment
    turns PostHog off there (`PostHogInit` behaves as `enabled: false`), alongside the `cron`,
    `email` and `sentry` switches.

  For plugin authors: action plugins receive a `trace` argument for observing completed events and
  the read-only app metadata as `lowdefyApp`; the engine trace gains `isConfigText({ text, pageId })`,
  and `@lowdefy/helpers` exports `filterElementsChain`.

  AutoComplete and PhoneNumberInput render their dropdowns inside the block, like Selector.

- effdeb3: Journey steps can reach controls that are not blocks. Wherever `click`, `fill`, `select`, `expect.visible` and `expect.text` take a `blockId`, they also take a target object: `{ blockId, row, column }` narrows to a grid row (zero-based, as displayed) or cell (by col-id), `text` names the interactive control with exactly that visible text, and `nth` picks among several matches. `text` on its own searches the page front-most layer first — an open dropdown menu, then an open dialog, then the page — so a confirm dialog's `Delete` is clicked over the grid's `Delete` cell buttons behind its mask. This makes grid cell buttons, confirm dialogs, modal footers and menu items addressable by `lowdefy_run_journey`, `POST /lowdefy-docs/journey` and `lowdefy test`. Unknown target keys are rejected before a browser opens, and a failed step names the target the way it was written (`block "grid" row 1 control "Edit" to be actionable`).

  A `click`, `open`, `fill` or `select` whose `text` or `containing` target has no `nth` must match exactly one visible element, or the step fails and says how to narrow it:

  ```
  Matched 3 controls with text "Delete" in the page; add nth: 0..2, or a blockId/row to narrow it.
  ```

  Expectations do not need one match: `expect.visible` passes when any match is visible and `expect.hidden` when none is.

- Updated dependencies [14c4764]
- Updated dependencies [f7fa621]
- Updated dependencies [099d412]
- Updated dependencies [cad92af]
- Updated dependencies [6144814]
- Updated dependencies [db1a4d3]
- Updated dependencies [ebf95f8]
- Updated dependencies [24383b5]
- Updated dependencies [2595439]
- Updated dependencies [f9e483f]
- Updated dependencies [bfc6a00]
- Updated dependencies [b226c43]
- Updated dependencies [c744e40]
- Updated dependencies [239a3a7]
- Updated dependencies [4cc0f36]
- Updated dependencies [ef64856]
- Updated dependencies [cb0acad]
- Updated dependencies [9a92898]
- Updated dependencies [0205b5a]
- Updated dependencies [316f5be]
- Updated dependencies [ba86509]
- Updated dependencies [f9d8520]
- Updated dependencies [e5b2f83]
- Updated dependencies [da76905]
- Updated dependencies [1766343]
- Updated dependencies [9ed1386]
- Updated dependencies [73c5e14]
- Updated dependencies [c3e0d79]
- Updated dependencies [959ec32]
- Updated dependencies [a34939d]
- Updated dependencies [e6302c6]
- Updated dependencies [aa6bb38]
- Updated dependencies [81bd4f0]
- Updated dependencies [ae3541c]
- Updated dependencies [99c9dac]
- Updated dependencies [7623c86]
- Updated dependencies [31911e7]
  - @lowdefy/node-utils@7.0.0
  - @lowdefy/helpers@7.0.0

## 6.1.0

### Patch Changes

- 1d3a0b8: Update dependencies to releases with published security fixes.

  - `hono` 4.13.5 and `@hono/node-server` 2.0.10 in the servers.
  - `ws` 8.21.0 in the servers; `postcss` 8.5.23 in the dev server.
  - The servers drop leftover Next.js-era dependencies they no longer use: `@sentry/nextjs` from `@lowdefy/server`, and the `webpack` and `@next/eslint-plugin-next` devDependencies.
  - `axios` 1.18.0 in the CLI and AxiosHttp.
  - `dompurify` 3.4.13 in `block-utils`, `blocks-basic` and `blocks-markdown`.
  - `echarts` 6.1.0, `mysql2` 3.23.1, `nodemailer` 9.1.1, `uuid` 13.0.1 and `@auth/mongodb-adapter` 3.11.3 in their plugins.
  - `tar` 7.5.21 and `picomatch` 4.0.4 in the build, `js-yaml` 4.3.2 in `e2e-utils`, and `@babel/core` 7.29.6 in `block-utils`.
  - `@auth/core` 0.41.3 in the servers and `plugin-next-auth`, whose peer range is now `>=0.41.3`. `@auth/mongodb-adapter` 3.11.3 depends on the same release.

  Two of these change output an app can see:

  - **`echarts` 6.1.0** changes chart defaults. Bar, pictorialBar, candlestick and boxplot series no longer draw past the grid edge; set `containShape: false` on the axis to restore the previous look. `axis.startValue` no longer sets `min`. The second argument of a `tooltip.valueFormatter` function is now `rawDataIndex`.
  - **`dompurify` 3.4.13** keeps a few attributes and elements that earlier releases removed: `command` / `commandfor`, `<selectedcontent>`, and some SVG attributes. HTML rendered by `Html`, `ClickableHtml`, `DangerousHtml`, `DangerousMarkdown` and other `renderHtml` properties may keep them.

- Updated dependencies [6d6f8fa]
- Updated dependencies [6d6f8fa]
  - @lowdefy/helpers@6.1.0

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
