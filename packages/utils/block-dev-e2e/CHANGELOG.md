# @lowdefy/block-dev-e2e

## 7.0.0

### Minor Changes

- ae3541c: feat: Lowdefy servers stop when whatever started them stops

  A Lowdefy server started by a test runner, a script or a coding agent's command could outlive it when that process was killed or timed out, and keep holding a few hundred megabytes of memory for days. Servers now stop with their owner, however it ends.

  - **`lowdefy start`, `lowdefy dev` and `lowdefy test`** start the server with node directly (no `pnpm run start` in between), forward SIGINT, SIGTERM and SIGHUP to it, and hold its stdin, so the server stops even when the CLI is killed outright. The dev server's Vite process stops when the dev manager is killed. A server run directly with `node`, as in a Docker image or on Vercel, behaves as before.
  - **`--exit-with-pid <pid>`** on `lowdefy start` and `lowdefy dev`, or the `LOWDEFY_EXIT_WITH_PID` environment variable, stops the server when that process exits. The variable passes through wrappers such as `pnpm exec`, `npx` or a secrets manager.
  - **Test tools set it for you.** The Playwright configs from `@lowdefy/e2e-utils` and `@lowdefy/block-dev-e2e` tie the server to the Playwright run, so a killed or timed-out run leaves no server behind.
  - **`startServer`** from `@lowdefy/e2e-utils/startServer` builds and starts an app's e2e server for other test runners (a vitest or Jest `globalSetup`) and scripts, tied to the calling process, and returns `stop()`.
  - **`@lowdefy/e2e-utils` no longer reuses a running server by default.** A server left on the port would serve an old build to new tests. Set `LOWDEFY_E2E_REUSE_SERVER=true` to reuse one (for example after `pnpm e2e:server`), and `LOWDEFY_E2E_PORT` to move a run to another port.
  - **`lowdefy hub ps`** lists the Lowdefy servers running on the machine and the process that owns each. **`lowdefy hub prune`** lists the servers whose owner is gone, and `--kill` stops them. It also finds servers kept running by a `lowdefy` CLI whose own starter was killed (such as a `pnpm exec` wrapper killed outright) and servers left running by older Lowdefy versions (including a dev server's Vite process left behind by a killed dev server), and never stops a server whose owner is alive and still has its own starter, or one run as a launchd or systemd service. Servers record themselves in `~/.lowdefy/servers` (moved by `LOWDEFY_HOME`), and the hub prunes servers whose owner is gone each time it starts. On Windows, servers are identified by their process creation time, so `prune` works there for servers that record themselves.

### Patch Changes

- 37e124c: fix(block-dev-e2e): Set the e2e port with `LOWDEFY_E2E_PORT`, and reuse a running server only on request

  Block e2e runs no longer attach to a server that is already listening on the package's
  port, which could belong to another checkout. Set `LOWDEFY_E2E_REUSE_SERVER=true` to reuse
  one, and `LOWDEFY_E2E_PORT` to run on another port.

- 5d6830c: fix(block-dev-e2e): Build each package's e2e app in its own copy of the server

  `createPlaywrightConfig` now builds and serves the e2e app from `_server/e2e/<package>`, an
  untracked copy of `packages/servers/server` that `scripts/prepare-e2e-server.mjs` prepares,
  instead of building inside `packages/servers/server`. An e2e run no longer changes the
  server's `package.json` or the root `pnpm-lock.yaml`, and different block packages can run
  their e2e suites at the same time.

- 43e5dc4: `:parallel_for` takes `:concurrency`, and expected errors a `:catch` handles log at debug

  - **`:concurrency`** on `:parallel_for` runs at most that many iterations at once (a positive integer; operators allowed), for routines that call a rate-limited service for every item. Every item still runs, and the result is the same as without it.
  - **Caught errors.** A request, service or user error inside a `:try` that has a `:catch` was logged as an error before the `:catch` handled it, so a routine that expects failures (a provider waterfall's 404s) filled the log. Those expected outcomes are now logged at debug. Config, operator and internal errors still go through full error handling (config location, the dev error feed, Sentry) even when caught. Errors with no `:catch`, and errors in `:catch` or `:finally`, are logged as before.
  - A request's schema errors in an endpoint step now name the step instead of `Request "undefined"`.
  - `createPlaywrightConfig` (`@lowdefy/block-dev-e2e`) takes optional `appDir`, `name`, `testMatch`, `services`, `env`, `fullyParallel` and `workers`, for suites that need their own app and services.

- Updated dependencies [81a5ad3]
- Updated dependencies [eab310c]
- Updated dependencies [2746b40]
- Updated dependencies [81bd4f0]
- Updated dependencies [effdeb3]
- Updated dependencies [6dc9114]
- Updated dependencies [ae3541c]
  - @lowdefy/e2e-utils@7.0.0

## 6.1.0

### Patch Changes

- Updated dependencies [1d3a0b8]
  - @lowdefy/e2e-utils@6.1.0

## 6.0.0

### Minor Changes

- 519163c: Add `getShortcutModifier` for testing `mod` keyboard shortcuts.

  A `mod` shortcut resolves to Cmd or Ctrl from the platform the browser reports, and Playwright emulates that platform per project — a Desktop Chrome project reports Windows even when the test runner is on macOS. A test that derives the key from `process.platform` therefore presses a key the app is not listening for, and only on some host operating systems.

  `getShortcutModifier(page)` reads the platform from the page instead, so the key a test presses is always the key the app is listening for:

  ```javascript
  import { getShortcutModifier } from '@lowdefy/e2e-utils';

  const mod = await getShortcutModifier(page);
  await page.keyboard.press(`${mod}+k`);
  ```

### Patch Changes

- Updated dependencies [ea4de26]
- Updated dependencies [519163c]
- Updated dependencies [8a82fb0]
- Updated dependencies [a783370]
  - @lowdefy/e2e-utils@6.0.0

## 5.6.0

### Patch Changes

- Updated dependencies [b09ad62]
  - @lowdefy/e2e-utils@5.6.0

## 5.5.1

### Patch Changes

- @lowdefy/e2e-utils@5.5.1

## 5.5.0

### Patch Changes

- @lowdefy/e2e-utils@5.5.0

## 5.4.0

### Patch Changes

- Updated dependencies [f0fea51]
- Updated dependencies [134792b]
  - @lowdefy/e2e-utils@5.4.0

## 5.3.0

### Patch Changes

- @lowdefy/e2e-utils@5.3.0

## 5.2.0

### Patch Changes

- @lowdefy/e2e-utils@5.2.0

## 5.1.0

### Patch Changes

- @lowdefy/e2e-utils@5.1.0

## 5.0.0

### Patch Changes

- Updated dependencies [f430f02dde]
  - @lowdefy/e2e-utils@5.0.0

## 4.7.3

### Patch Changes

- @lowdefy/e2e-utils@4.7.3

## 4.7.2

### Patch Changes

- @lowdefy/e2e-utils@4.7.2

## 4.7.1

### Patch Changes

- Updated dependencies [ce1194081]
- Updated dependencies [ab28590fb]
  - @lowdefy/e2e-utils@4.7.1

## 4.7.0

### Patch Changes

- Updated dependencies [356de36b6]
- Updated dependencies [a41f6d2ab]
- Updated dependencies [811f80760]
  - @lowdefy/e2e-utils@4.7.0

## 4.6.0

### Minor Changes

- fb7910f62: test(blocks): Add comprehensive Playwright e2e tests for blocks-antd and blocks-basic

  **@lowdefy/block-dev-e2e** (new package)

  - Shared test utilities for block e2e testing in the monorepo
  - `createPlaywrightConfig` for consistent Playwright setup
  - `getBlock` helper using framework wrapper ID pattern (`#bl-{blockId}`)
  - `navigateToTestPage` for test page navigation

  **@lowdefy/blocks-antd**

  - ~700 e2e tests covering all 63 blocks
  - Test coverage for input, display, layout, navigation, and overlay blocks
  - Block-specific e2e helpers (Button, TextInput, Selector)

  **@lowdefy/blocks-basic**

  - ~40 e2e tests covering core blocks (Box, Span, Anchor, Html, etc.)

### Patch Changes

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

- Updated dependencies [5e03091ee]
  - @lowdefy/e2e-utils@4.6.0
