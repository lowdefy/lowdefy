---
'@lowdefy/server-dev': minor
---

feat(server-dev): A request type can declare itself external, so a data set journey sinks only that request

A plugin connection can hold database access and still have some request types that reach an outside service, such as one that downloads files or calls an AI provider. Marking the whole connection `external` would sink its database work too. A request resolver can now declare `meta.dataSet: 'external'`: under a data set journey that request is recorded in `sunk` and answered with `null`, while the connection's other request types run for real against the run's database.
