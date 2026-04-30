---
'@lowdefy/connection-knex': minor
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

chore(connection-knex): update knex and SQL drivers; replace `sqlite3` with `better-sqlite3`; replace `mysql` with `mysql2`.

Bumped knex and its dialect drivers, and consolidated onto the actively-maintained drivers — replaced `sqlite3` with `better-sqlite3` and `mysql` with `mysql2`. Subsumes the prior `sqlite3@5.1.7` darwin-arm64 fix.

`@lowdefy/connection-knex` dependency changes:

- `knex` `2.5.1` → `3.2.9`. Knex 3.x drops Node < 16; Lowdefy already requires Node 18+. The `knex(config)`, `.raw()`, and dynamic query-builder API surface used by `KnexRaw` / `KnexBuilder` is unchanged.
- `pg` `8.11.3` → `8.20.0`.
- **Removed** `mssql`. Knex's `mssql` dialect actually requires `tedious` (not the `mssql` package), and Lowdefy never imported `mssql` directly — it was only ever a vehicle for pulling tedious into the install tree. `client: mssql` in user YAML is unchanged: the knex client name stays the same, only the underlying npm package shipped with `connection-knex` changes.
- **Added** `tedious` `19.2.1` as the SQL Server driver — the package knex actually loads when `client: mssql` is used.
- **Removed** `sqlite3`. The driver is in maintenance-only mode upstream (the v6 release marked the repo unmaintained).
- **Added** `better-sqlite3` `12.9.0` as the SQLite driver. Selectable as `client: better-sqlite3` (or `client: sqlite`, which is now an alias of `better-sqlite3` — see runtime client handling below).
- **Removed** `mysql`. Unmaintained upstream since 2020.
- **Added** `mysql2` `3.22.3` as the MySQL / MariaDB driver. Selectable as `client: mysql2` in connection YAML.

Runtime client handling (in `createKnex`):

- `client: sqlite` is silently remapped to `client: better-sqlite3`. `sqlite` was historically a knex-level alias of `sqlite3`; this preserves the YAML alias while the underlying driver changes.
- `client: sqlite3` now throws a `ConfigError` with a migration message: `Knex connection "client: sqlite3" is no longer supported. Use "client: better-sqlite3" or "client: sqlite" instead.` Existing apps using `client: sqlite3` need to update their connection YAML.
- `client: mysql` now throws a `ConfigError` with a migration message: `Knex connection "client: mysql" is no longer supported. Use "client: mysql2" instead.` Existing apps using `client: mysql` need to update their connection YAML. `mysql` is **not** silently remapped because knex treats `mysql` and `mysql2` as separate dialects with subtly different SQL formatters, not aliases — the migration is a deliberate user choice.

`pnpm.onlyBuiltDependencies` allowlist for `better-sqlite3`:

`better-sqlite3` runs a native-binding install script (`prebuild-install` with a `node-gyp rebuild` fallback). pnpm 10 silently suppresses postinstall scripts for unapproved packages, which leaves the binding unbuilt and crashes `KnexRaw` / `KnexBuilder` at runtime.

- Added `better-sqlite3` to the allowlist on `@lowdefy/server`, `@lowdefy/server-dev`, and `@lowdefy/server-e2e`. These are the install roots in the CLI fetch flow under `.lowdefy/{dev,build}/`, where pnpm honors the per-package `pnpm.onlyBuiltDependencies` field.
- Also added the same allowlist to the monorepo root `package.json`. The per-package field is ignored at workspace-root install (pnpm 10 only honors it on the install root), so contributors running `pnpm install` at the repo root would otherwise have to `pnpm rebuild better-sqlite3` manually.
