---
'lowdefy': minor
'@lowdefy/build': minor
'@lowdefy/node-utils': minor
'@lowdefy/server-dev': minor
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

feat: Journey data set files and `lowdefy data list`

Declare a journey data set in `tests/data/<name>.yaml`: committed `fixtures` keyed by connection id, named `users` (injected callers, no credentials), optional `indexes` in the `listIndexes()` shape, and an optional seeded `generate` block for background documents. Everything a data set loads is committed, so it is the same on every machine. `lowdefy data list` prints each data set with the documents it loads and the users it names.

A data set can extend others with a top-level `extends: [<data set name>, ...]`. The named data sets' fixtures, indexes and users load first, in the order listed, then the file's own. A later fixture with an `_id`, an index with the same `key` or a user of the same name replaces the earlier one. `generate` stays per file: only the named data set's own `generate` runs, and its refs and `_id` checks see the extended fixtures. A set reached twice loads once, and a cycle or an undeclared name is refused.

Journeys accept `data: <name>` and a data set user name as `user:`, and `lowdefy test` prints the data set a run used once, with its document count.
