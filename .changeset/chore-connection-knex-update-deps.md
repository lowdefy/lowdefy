---
'@lowdefy/connection-knex': minor
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

chore(connection-knex): update knex and SQL drivers; replace `sqlite3` with `better-sqlite3`; add `mysql2`.

Bumped knex and its dialect drivers, replaced the unmaintained `sqlite3` driver with `better-sqlite3`, and added `mysql2` alongside the unmaintained `mysql` driver. Subsumes the prior `sqlite3@5.1.7` darwin-arm64 fix.

`@lowdefy/connection-knex` dependency changes:

- `knex` `2.5.1` → `3.2.9`. Knex 3.x drops Node < 16; Lowdefy already requires Node 18+. The `knex(config)`, `.raw()`, and dynamic query-builder API surface used by `KnexRaw` / `KnexBuilder` is unchanged.
- `pg` `8.11.3` → `8.20.0`.
- `mssql` `10.0.1` → `12.5.0`. v11 raises the Node floor to ≥18 (already satisfied); v12 stops cloning config objects, which is fine because Lowdefy hands the user's YAML to `knex(connection)` once and never mutates it.
- **Removed** `sqlite3`. The driver is in maintenance-only mode upstream (the v6 release marked the repo unmaintained).
- **Added** `better-sqlite3` `12.9.0` as the SQLite driver. Selectable as `client: better-sqlite3` (or `client: sqlite`, which is now an alias of `better-sqlite3` — see runtime remap below).
- **Added** `mysql2` `3.22.3` as the recommended MySQL/MariaDB driver. The `mysql` package is left in (still selectable as `client: mysql`) for backwards compatibility but is no longer the recommended choice — the `mysql` package is unmaintained upstream since 2020.

Runtime client remapping (in `createKnex`):

- `client: sqlite` is silently remapped to `client: better-sqlite3`. `sqlite` was historically a knex-level alias of `sqlite3`; this preserves the YAML alias while the underlying driver changes.
- `client: sqlite3` now throws a `ConfigError` with a migration message: `Knex connection "client: sqlite3" is no longer supported. Use "client: better-sqlite3" or "client: sqlite" instead.` Existing apps using `client: sqlite3` need to update their connection YAML.
- `mysql` and `mysql2` are not remapped — they are separate knex dialects with subtly different SQL formatters. Users who want the maintained driver should explicitly switch to `client: mysql2`.

`pnpm.onlyBuiltDependencies` allowlist for `better-sqlite3`:

`better-sqlite3` runs a native-binding install script (`prebuild-install` with a `node-gyp rebuild` fallback). pnpm 10 silently suppresses postinstall scripts for unapproved packages, which leaves the binding unbuilt and crashes `KnexRaw` / `KnexBuilder` at runtime.

- Added `better-sqlite3` to the allowlist on `@lowdefy/server`, `@lowdefy/server-dev`, and `@lowdefy/server-e2e`. These are the install roots in the CLI fetch flow under `.lowdefy/{dev,build}/`, where pnpm honors the per-package `pnpm.onlyBuiltDependencies` field.
- Also added the same allowlist to the monorepo root `package.json`. The per-package field is ignored at workspace-root install (pnpm 10 only honors it on the install root), so contributors running `pnpm install` at the repo root would otherwise have to `pnpm rebuild better-sqlite3` manually.
