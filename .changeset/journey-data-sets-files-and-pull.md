---
'lowdefy': minor
'@lowdefy/build': minor
'@lowdefy/node-utils': minor
'@lowdefy/server-dev': minor
---

feat: Journey data set files, `lowdefy data pull` and `lowdefy data list`

Declare a journey data set in `tests/data/<name>.yaml`: committed `fixtures` keyed by connection id, named `users` (injected callers, no credentials), optional `indexes` in the `listIndexes()` shape, and an optional `snapshot` block naming the pre-production environment and exactly the connections to copy.

`lowdefy data pull <name>` copies a scoped, capped snapshot of the listed connections into `.lowdefy/data/<name>/`, with their indexes and with the fields each entry `omit`s left out. Run it with that environment's secrets, for example `infisical run --env=staging -- lowdefy data pull staging-sample`. The pull reads only from an environment that sets `dataPull: true` (a new boolean on `config.environments.<name>`, default `false`; set it only on pre-production environments, never on production), and refuses every other environment before it reads any secret. It is then guarded by the environments' `guards.secrets` pins: each connection's `databaseUri` must be a `_secret`, its value must match the `from` environment's pin and must not match any other environment's distinct pin. A failed pull leaves the previous snapshot in place. `lowdefy data list` prints each data set with its snapshot's age and document count, and says when the snapshot block changed since the pull.

Journeys accept `data: <name>` and a data set user name as `user:`, and `lowdefy test` prints the data set a run used once, warning when its snapshot is more than 14 days old.

The build gains an `environmentGuards: 'all'` option, used only by the pull's own build, which writes every environment's guards and `dataPull` flag to `environmentGuards.json` and skips the build's guard check.
