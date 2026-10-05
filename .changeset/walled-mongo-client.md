---
'@lowdefy/connection-mongodb': minor
'@lowdefy/api': minor
'@lowdefy/build': minor
---

feat(tenant): a walled MongoDB client for plugins; refuse an unwalled connection that reaches a walled database

A plugin that needed MongoDB used to open its own handle from the database secret, which walked straight around the tenant wall. `@lowdefy/connection-mongodb/walled` now exports `getWalledCollection`, a client whose `find`, `findOne`, `aggregate`, `countDocuments`, `insertOne`, `insertMany`, `updateOne`, `updateMany`, `findOneAndUpdate`, `deleteOne`, `deleteMany` and `bulkWrite` apply the wall exactly as the matching MongoDB requests do: reads and writes are scoped to the caller's organization, inserts and upserts are stamped and checked as stored, change logs are kept, and `$out` and `$merge` are refused. A plugin's request resolver receives `walled(connectionId)` and passes its result to `getWalledCollection`.

Under `policy: tenant`, a non-scopable connection (SMTP, a plugin's own connection type) may not reach a walled database. The build fails when such a connection reads the secret behind a walled connection's `databaseUri`. When one holds a URI to a walled database under another secret or as a literal, the server logs an error at start and refuses that connection's requests with a `ConfigError`; the rest of the app keeps serving. There is no opt-out: `~ignoreBuildChecks` does not suppress the build error. Give the plugin a `mongoConnectionId` and use `@lowdefy/connection-mongodb/walled`.
