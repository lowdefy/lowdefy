---
'@lowdefy/server-dev': minor
---

feat(server-dev): A journey data set run gives each database your connections name a database of its own

An app that reads several MongoDB databases can now seed a collection name in each of them. Connections with the same `databaseUri` secret (or literal) and `databaseName` share one run database, and connections that differ in either read different ones, as they do outside the run. Before, every connection read one run database, so a data set that seeded `users` in the app's database could not also seed `users` in an auth database: the journey was refused. That refusal and its warning are gone. A connection whose `databaseUri` or `databaseName` is computed per request reads the run's first database. The run still drops all its databases when the journey ends.
