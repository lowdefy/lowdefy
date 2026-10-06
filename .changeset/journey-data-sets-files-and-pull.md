---
'lowdefy': minor
'@lowdefy/build': minor
'@lowdefy/node-utils': minor
'@lowdefy/server-dev': minor
---

feat: Journey data set files and `lowdefy data list`

Declare a journey data set in `tests/data/<name>.yaml`: committed `fixtures` keyed by connection id, named `users` (injected callers, no credentials), optional `indexes` in the `listIndexes()` shape. Everything a data set loads is committed, so it is the same on every machine. `lowdefy data list` prints each data set with the documents it loads and the users it names.

Journeys accept `data: <name>` and a data set user name as `user:`, and `lowdefy test` prints the data set a run used once, with its document count.
