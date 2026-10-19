---
'@lowdefy/block-dev-e2e': patch
---

fix(block-dev-e2e): Build each package's e2e app in its own copy of the server

`createPlaywrightConfig` now builds and serves the e2e app from `_server/e2e/<package>`, an
untracked copy of `packages/servers/server` that `scripts/prepare-e2e-server.mjs` prepares,
instead of building inside `packages/servers/server`. An e2e run no longer changes the
server's `package.json` or the root `pnpm-lock.yaml`, and different block packages can run
their e2e suites at the same time.
