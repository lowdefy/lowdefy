---
'@lowdefy/test-utils': minor
'@lowdefy/server-dev': patch
---

refactor(test-utils, server-dev): Journey data sessions live in `@lowdefy/test-utils/dataSets`

The code that runs a journey on a data set moves from the dev server into a new `./dataSets` export of `@lowdefy/test-utils`: the in-memory MongoDB data store, data sessions, the `tests/data` reader and loaders, and the gate that decides what each connection does under a session (MongoDB redirected to the session database, outside services recorded and never called, undeclared types refused). The dev server imports it from there, so journeys and the coming endpoint tests load data and gate connections with one implementation.

Nothing changes for an app or its journeys. The dev server still starts and owns the data store, in its own process, and now depends on `@lowdefy/test-utils`, which carries `mongodb-memory-server-core` in its place.
