---
'@lowdefy/build': minor
'@lowdefy/api': minor
'@lowdefy/errors': minor
'@lowdefy/server': minor
'lowdefy': minor
'@lowdefy/docs': minor
---

feat: Migrations — `lowdefy migrate`, declarative forward-only database migrations

A Lowdefy app is config plus a live database. The config is versioned, built and deployed atomically; the database is not — it holds documents written by earlier versions of the config, in the shape those versions expected. Migrations are the framework verb for "and move the existing documents" when a collection's shape changes.

**File shape (`@lowdefy/build`).** Migrations are files the build discovers in a `migrations/` directory at the config root. Each file, `migrations/<id>.yaml`, has an optional `name:` and a `routine:` — the same step and control grammar an `Api` endpoint routine uses, so `MongoDB*` request steps, `:for`, `:try`, `_step` and `_secret` all work with nothing new to learn. The migration id is the filename stem; ordering is lexical on the id. The build validates each routine through the same `buildRoutine` code an endpoint uses (including the tenant audit), checksums the raw file text, and writes one artifact per migration to `build/migrations/<id>.json` plus the ordered index `build/migrations.json` (always written, as `[]` when nothing is declared).

**The runner (`@lowdefy/api`, `@lowdefy/server`, `lowdefy`).** `lowdefy migrate [--dry-run] [--to <id>] [--yes] [--allow-checksum-mismatch] [--json]` runs pending migrations, in order, on a caller-less system context (like a scheduled endpoint), applying each and appending a ledger document as it completes. The runner lives in the server package (`migrate:lowdefy`) where the connection plugins and database driver are installed, and the CLI spawns it the way `build` spawns `build:lowdefy`. A migration that touches a tenant-walled connection must declare `tenant: none` or `runAs: { organizationId }`, enforced at build. Migrations are **forward-only** — a mistake is corrected by a new forward migration, never a down migration.

**The ledger.** A `migrations` collection in the app's own database holds one document per applied migration (`{ _id, checksum, appliedAt, durationMs, status, lowdefyVersion }`). The ledger connection is named at `config.migrations.ledgerConnectionId` (default: a connection with id `migrations`), is a `MongoDBCollection` connection, and is accessed outside the tenant wall. An advisory lock document (`_id: "$lock"`) in the same collection, with an expiry and a heartbeat, prevents two concurrent runs from applying the same migration; a crashed run's lock expires and is stolen with a warning. A checksum mismatch on an applied migration (its file changed) halts the run unless `--allow-checksum-mismatch` is passed.

**Run-on-deploy.** Run `lowdefy migrate --yes` in the deploy step, and the server refuses to serve while any built migration is unapplied. The preflight (`resolveMigrationPreflight`, mirroring the tenant preflight) is lazily-run-once and awaited per request: a pending-migration refusal memoizes until restart, a connectivity failure retries, and a migration in progress returns a retryable error so a cold-started instance never serves a half-migrated database. Opt out with `config.migrations.preflight: false`. On a rolling deploy, migrations must be backward-compatible with the currently-running code (expand/contract): add-and-backfill in one deploy, drop in a later one.

Non-goals: no schema-diffing or auto-generated migrations, no down migrations, no cross-collection transactions, and no migrations for non-database connections in this version.

**Docs (`@lowdefy/docs`).** A new Migrations concept page and a `migrate` entry on the CLI page.
