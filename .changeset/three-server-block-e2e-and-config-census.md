---
'@lowdefy/block-dev-e2e': minor
---

feat(block-dev-e2e): block e2e specs run against the development and e2e servers, not just production

`createPlaywrightConfig` takes a `server` option: `prod` (the default, unchanged), `dev` (boots `lowdefy dev` instead of `build && start`) or `e2e` (builds against `@lowdefy/server-e2e`), and reads `LOWDEFY_E2E_SERVER` when the option is not passed, so a CI matrix can run one block's committed `playwright.config.js` against each of the three servers without editing it. CI does exactly that for `@lowdefy/blocks-basic` and `@lowdefy/blocks-antd` on every pull request (the prod leg blocks; the dev and e2e legs report until their first green run), which is the first time the block e2e suite has run in CI. A committed config census script (`pnpm census`) reports the escape-hatch share, files over 80 lines and intent-comment counts the v1 design measured by hand, and the canary runs it as an informational artifact.
