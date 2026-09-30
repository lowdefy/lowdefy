---
'@lowdefy/connection-mongodb': minor
'@lowdefy/api': minor
'@lowdefy/build': minor
---

feat(tenant): a walled MongoDB client for plugins; warn when an unwalled connection reaches a walled database

A plugin that needed MongoDB used to open its own handle from the database secret, which walked straight around the tenant wall. `@lowdefy/connection-mongodb/walled` now exports `getWalledCollection`, a client whose `find`, `findOne`, `aggregate`, `countDocuments`, `insertOne`, `insertMany`, `updateOne`, `updateMany`, `findOneAndUpdate`, `deleteOne`, `deleteMany` and `bulkWrite` apply the wall exactly as the matching MongoDB requests do: reads and writes are scoped to the caller's organization, inserts and upserts are stamped and checked as stored, change logs are kept, and `$out` and `$merge` are refused. A plugin's request resolver receives `walled(connectionId)` and passes its result to `getWalledCollection`.

The build now warns when a non-scopable connection (SMTP, a plugin's own connection type) reads the secret behind a walled connection's `databaseUri`, and the server warns at start when such a connection holds a URI to a walled database. Both warnings become errors in the next release.
