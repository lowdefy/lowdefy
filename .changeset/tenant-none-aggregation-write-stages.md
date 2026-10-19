---
'@lowdefy/connection-mongodb': patch
---

fix(connection-mongodb): Refuse `$out` and `$merge` in a `tenant: none` aggregation on a walled connection.

Under `auth.organizations.policy: tenant`, a `MongoDBAggregation` with `tenant: none` could write its output with `$out` or `$merge` without any check, so it could land rows without `organization_id` in a walled collection, and the tenant preflight would then refuse to serve the app. These stages are already refused on the scoped path. They are now refused under `tenant: none` as well, with an error that names the alternatives: return the documents and write them with `MongoDBInsertMany` or `MongoDBBulkWrite`, which check every row, or run the aggregation on a `tenant: shared` connection that writes into a collection no scoped connection reads. Aggregations that only read are unchanged.
