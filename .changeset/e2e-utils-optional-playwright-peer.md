---
'@lowdefy/e2e-utils': patch
---

chore(e2e-utils): Mark the `@playwright/test` peer dependency optional — the `./runtime` subpath does not use it, so `@lowdefy/server-dev` can drive pages through `playwright-core` without installing the test runner.
