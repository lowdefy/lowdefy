---
'@lowdefy/block-dev-e2e': minor
'@lowdefy/blocks-antd': minor
'@lowdefy/blocks-basic': minor
---

test(blocks): Add comprehensive Playwright e2e tests for blocks-antd and blocks-basic

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
