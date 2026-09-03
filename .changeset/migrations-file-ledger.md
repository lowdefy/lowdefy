---
'@lowdefy/build': minor
'@lowdefy/api': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/node-utils': minor
'lowdefy': minor
'@lowdefy/docs': patch
---

feat(migrations): Record applied migrations in a committed per-stage ledger file and generate the CI pipeline.

The migration ledger moves out of the database into the repository: `.lowdefy/migrations/<stage>.json`, one file per environment, selected by `STAGE` (`--stage` on the CLI, then `STAGE` from the environment, then `local` for a developer's own database). `lowdefy migrate` rewrites the file after every applied migration; `lowdefy build` reads it and writes `build/migrations.json` as `{ stage, migrations: [{ id, checksum, applied }] }`, so the serving preflight is a file check with no database round trip. A production build with migrations and no `STAGE` is a build error; a migration file edited after being applied is a build warning and a migrate-time refusal unless `--allow-checksum-mismatch`.

Removed: `config.migrations.ledgerConnectionId`, `config.migrations.lockTimeoutMs`, the `migrations` ledger collection, the `$lock` document and the in-progress retry case. The pipeline's concurrency group is the lock.

New `lowdefy init-migrations [--stages dev,prod]` writes, per stage, a dry-run workflow (pull requests: plan posted as a PR comment) and a run workflow (push or dispatch: build, apply, commit the ledger `if: always()`, with a commented deploy job that must follow it), an empty ledger, and the `.gitignore` exception (`!.lowdefy/migrations/`, `.lowdefy/migrations/local.json`) that `lowdefy init` now also writes. `lowdefy migrate` gains `--stage` and prints the stage, ledger path and pending ids before asking for confirmation.

The dev server now builds migrations too: `lowdefy_build_status` carries a `migrations` section (stage, pending and changed ids), and two MCP tools — `lowdefy_migrations_status` and `lowdefy_migrate` (dry run, or apply behind `cli.agentTools.allowWriteRequests`) — plus `GET /lowdefy-docs/migrations` and `POST /lowdefy-docs/migrate`. A ledger change rebuilds. `lowdefy check` gains a check-only warning for a `collections` field declared `required` that no migration file names.
