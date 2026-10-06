---
'lowdefy': patch
---

fix(cli): Dev server installs no longer fail on pnpm 11 with `ERR_PNPM_IGNORED_BUILDS` for `mongodb-memory-server`

The `pnpm-workspace.yaml` the CLI writes for a server now skips the `mongodb-memory-server` install script, as it does for `@sentry/cli`. The script only downloads a MongoDB binary, which the dev server downloads when it first starts an in-memory database. A parent workspace that allows or ignores `mongodb-memory-server` keeps its own choice.
