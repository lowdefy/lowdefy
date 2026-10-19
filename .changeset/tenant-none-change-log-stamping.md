---
'@lowdefy/api': patch
'@lowdefy/connection-mongodb': patch
---

fix(api,connection-mongodb): Stamp `tenant: none` change-log records with the organization of their rows

Under `auth.organizations.policy: tenant`, a `tenant: none` write on a MongoDB connection with a `changeLog` wrote its change-log record without an `organization_id`. The log collection is usually read through a scoped connection, so the record was invisible there and made the tenant preflight refuse to serve the app.

The record now carries the organization of the rows it records. A single-document write takes it from the row it inserted, updated or deleted, and a write that matched no row writes no record. A multi-document write must be held to one organization before it runs: `MongoDBInsertMany` and `MongoDBInsertManyConsecutiveIds` must insert documents of one organization, `MongoDBUpdateMany` and `MongoDBDeleteMany` must match `organization_id` by equality in the filter, and `MongoDBUpdateMany` may not write it. Otherwise the request is refused before it writes, with an error naming the fix. Connections without a `changeLog` are not affected.

`$out` and `$merge` stay refused in unscoped aggregations; the error and the docs now show the alternative: return the rows and write them with `MongoDBInsertMany` or `MongoDBBulkWrite`, which check every row.
