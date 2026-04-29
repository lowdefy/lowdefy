---
'@lowdefy/connection-knex': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

fix(connection-knex): resolve SQLite native binding on darwin-arm64 with pnpm 10.

`KnexRaw` and `KnexBuilder` requests against a SQLite connection were crashing at runtime on Apple Silicon with `Cannot find module '.../node_sqlite3.node'`, because no native binding had been extracted or built during install.

Two changes:

- Bump `sqlite3` from `5.1.6` to `5.1.7` in `@lowdefy/connection-knex`. `5.1.6` resolves its prebuilt binding through `@mapbox/node-pre-gyp`, which fails on darwin-arm64 for several Node/pnpm combinations; `5.1.7` uses `prebuild-install` with a `node-gyp rebuild` fallback.
- Add `sqlite3` to `pnpm.onlyBuiltDependencies` in `@lowdefy/server` and `@lowdefy/server-dev`. pnpm 10 silently suppresses postinstall scripts for unapproved packages, which prevented `sqlite3`'s install script from running at all in `.lowdefy/build/` and `.lowdefy/dev/` and left no `node_sqlite3.node` on disk. Approving it lets the prebuild fetch (or source build) run.
