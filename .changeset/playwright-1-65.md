---
'@lowdefy/server-dev': patch
'@lowdefy/e2e-utils': patch
'@lowdefy/block-dev-e2e': patch
---

fix(deps): Update Playwright to 1.65.0

Playwright 1.59 does not install browsers on Ubuntu 26.04, which is now what GitHub Actions' `ubuntu-latest` runs. Playwright 1.61 added Ubuntu 26.04 support. The dev server's browser tools (screenshots, journeys) and `@lowdefy/e2e-utils` now use Playwright 1.65.0. An app that pins `@playwright/test` for its e2e tests should update it to 1.65.0 to match the `@lowdefy/e2e-utils` peer dependency.
