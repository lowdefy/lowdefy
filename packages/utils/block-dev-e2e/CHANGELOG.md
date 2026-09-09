# @lowdefy/block-dev-e2e

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
