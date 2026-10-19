---
'@lowdefy/e2e-utils': patch
'@lowdefy/server-e2e': patch
---

fix(e2e-utils): Reuse a running server only when it is this app's e2e build

`createConfig` and `createMultiAppConfig` reused any server that answered on the test port,
so `pnpm e2e` could silently run against `lowdefy dev`, a production build, or the e2e
server of another app or git worktree, where request mocks and the e2e session do not
apply. The e2e server now answers `GET /api/e2e/identity` with the build directory it
serves, and a Playwright global setup compares it with the app's build directory before
any test runs. Any other server on the port stops the run with an error that names the
port. Reusing this app's own e2e server (for example one started with `pnpm e2e:server`)
still skips the build. Configs that extend the base config keep the check as long as they
keep its `globalSetup`.
