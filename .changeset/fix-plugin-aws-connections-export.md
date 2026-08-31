---
'@lowdefy/plugin-aws': patch
---

fix: Add explicit `./connections` export for unbundled Node ESM.

The package's `"./*"` exports wildcard mapped the `connections` specifier to
the `dist/connections` directory. Bundlers completed that to `.js`, but the
Hono server imports plugin files with plain Node ESM resolution, which
rejects directory imports (`ERR_UNSUPPORTED_DIR_IMPORT`). An explicit
`"./connections": "./dist/connections.js"` entry now takes precedence over
the wildcard.
