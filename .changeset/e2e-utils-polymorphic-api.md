---
'@lowdefy/e2e-utils': minor
'@lowdefy/cli': minor
'@lowdefy/client': minor
'@lowdefy/blocks-antd': minor
'@lowdefy/block-dev-e2e': patch
---

feat(e2e-utils): Add e2e testing package for Lowdefy apps

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

- Expose `window.lowdefy` when `NEXT_PUBLIC_LOWDEFY_E2E=true` for e2e state/validation access

**@lowdefy/blocks-antd**

- Flatten e2e helper APIs for polymorphic proxy compatibility
- Add TextArea e2e helper

**@lowdefy/block-dev-e2e**

- Remove unused srcDir variable
