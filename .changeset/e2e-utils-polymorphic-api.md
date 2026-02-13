---
'@lowdefy/e2e-utils': minor
'@lowdefy/client': minor
'@lowdefy/blocks-antd': minor
'@lowdefy/block-dev-e2e': patch
---

Add polymorphic API for app developer e2e testing

**@lowdefy/e2e-utils**

- Add `createConfig()` for Playwright config with automatic build and server management
- Add `ldf` fixture with polymorphic block API (`ldf.blocks['id'].method()`)
- Add `globalSetup` that runs `lowdefy build` and generates e2e manifest
- Add manifest generation from build artifacts for block type resolution
- Export fixtures from `@lowdefy/e2e-utils/fixtures`

**@lowdefy/client**

- Expose `window.lowdefy` when `NEXT_PUBLIC_LOWDEFY_E2E=true` for production e2e testing

**@lowdefy/blocks-antd**

- Flatten e2e helper APIs for polymorphic proxy compatibility
- Add TextArea e2e helper

**@lowdefy/block-dev-e2e**

- Remove unused srcDir variable
