---
'lowdefy': minor
'@lowdefy/build': minor
'@lowdefy/node-utils': minor
'@lowdefy/server-dev': minor
---

feat: Journeys run on named data sets

Journeys can run on named data sets. Declare one in `tests/data/<name>.yaml` with fixtures, named users and, optionally, a snapshot of a pre-production database pulled with `lowdefy data pull <name>`. The pull copies only the connections the data set lists, can omit fields, and is guarded by the environment's `guards.secrets` pins. A journey with `data:` runs against a fresh in-memory MongoDB database of its own, on the running dev server, and your own browser tabs keep using your real database. `user:` and `as:` can name a data set user.
