# @lowdefy/block-dev-e2e

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
