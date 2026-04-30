---
'@lowdefy/connection-knex': minor
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

chore(connection-knex): update knex and SQL drivers; add `better-sqlite3` client.

Bumped knex and its dialect drivers, and added `better-sqlite3` so users can opt into the actively-maintained SQLite driver. Subsumes the prior `sqlite3@5.1.7` darwin-arm64 fix.

`@lowdefy/connection-knex` dependencies:

- `knex` `2.5.1` → `3.2.9`. Knex 3.x drops Node < 16; Lowdefy already requires Node 18+. The `knex(config)`, `.raw()`, and dynamic query-builder API surface used by `KnexRaw` / `KnexBuilder` is unchanged, so no source changes were needed.
- `pg` `8.11.3` → `8.20.0`.
- `mssql` `10.0.1` → `12.5.0`. v11 raises the Node floor to ≥18 (already satisfied); v12 stops cloning config objects, which is fine because Lowdefy hands the user's YAML to `knex(connection)` once and never mutates it.
- `sqlite3` `5.1.7` → `6.0.1`. Note that `sqlite3` upstream is now in maintenance-only mode; new apps should prefer the new `better-sqlite3` client.
- Added `better-sqlite3` `12.9.0`. Selectable as `client: better-sqlite3` in connection YAML — synchronous, faster, and actively maintained.
- `mysql` left at `2.18.1` (already the latest published version).

`pnpm.onlyBuiltDependencies` allowlist for `better-sqlite3` and `sqlite3`:

Both packages run native-binding install scripts (`prebuild-install` with a `node-gyp rebuild` fallback). pnpm 10 silently suppresses postinstall scripts for unapproved packages, which leaves the binding unbuilt and crashes `KnexRaw` / `KnexBuilder` at runtime with `Cannot find module '...node_sqlite3.node'`.

- Added the allowlist to `@lowdefy/server`, `@lowdefy/server-dev`, and `@lowdefy/server-e2e`. These are the install roots in the CLI fetch flow under `.lowdefy/{dev,build}/`, where pnpm honors the per-package `pnpm.onlyBuiltDependencies` field.
- Also added the same allowlist to the monorepo root `package.json`. The per-package field is ignored at workspace-root install (pnpm 10 only honors it on the install root), so contributors running `pnpm install` at the repo root would otherwise have to `pnpm rebuild sqlite3 better-sqlite3` manually.
