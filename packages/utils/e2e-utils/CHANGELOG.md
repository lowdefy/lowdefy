# @lowdefy/e2e-utils

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
