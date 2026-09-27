---
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

chore(servers): Remove dependencies the servers do not import

`@lowdefy/server-dev` no longer depends on `process`, `@lowdefy/engine` and `postcss`, and
`@lowdefy/server` and `@lowdefy/server-e2e` no longer depend on `pino` directly (it still
comes with `@lowdefy/logger`, and `postcss` with `vite`). This trims the install in every
app's server directory.
