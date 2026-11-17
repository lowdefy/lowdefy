---
'lowdefy': minor
---

feat(cli): `lowdefy test` checks the committed access table

Every `lowdefy test` run that reads the production build (`--headless --build`, `--access` and `--update-access`) compares the app's access table with a committed `tests/access.yaml` before any journey runs, and fails on any changed cell, naming it, for example `endpoints.billing-run-approve.technician: deny → allow`. Paths, `--filter`, `--tag` and `--tier` choose journeys only: the whole table is checked every time.

- `lowdefy test --access` runs only the check. `lowdefy test --update-access` rewrites the file from the build. With no file, it first writes a `tests/data/roles.yaml` data set with one user per declared role and a `no-role` user, when the app has none.
- Either flag refuses journey paths and the other test options, naming the command meant.
- A production-build run of an app with auth and no `tests/access.yaml` warns with the command that writes it: `lowdefy build --no-client-build && lowdefy test --update-access`.
- `lowdefy journeys variants` no longer writes role refusal variants.
