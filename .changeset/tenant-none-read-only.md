---
'@lowdefy/api': major
'@lowdefy/build': major
'@lowdefy/connection-mongodb': major
'@lowdefy/docs-content': patch
---

feat: `tenant: none` is read-only

- **Breaking:** under `auth.organizations.policy: tenant`, a request or routine step with `tenant: none` on a scoped connection may only read. One whose type writes (`MongoDBInsertOne`, `MongoDBUpdateMany`, `MongoDBBulkWrite`, `MongoDBTableChanges`, the enrichment requests and the rest) fails the build with a `ConfigError` naming the step or request, its type and its connection, and the same write is refused at runtime. An aggregation with `$out` or `$merge` under `tenant: none` is refused at runtime, and so is every write method of the walled MongoDB client a plugin opens under `tenant: none`. Reads under `tenant: none` still reach every organization's rows. To write from a caller-less run (a schedule, an auth hook, a verified webhook), call an endpoint with a `CallApi` step that names the `organization`: its requests run with the wall on, filtered and stamped with that organization.
- A write in a system run bound to no organization fails that request with `TenantIntegrityError` (naming the collection, connection and tenant field), logged at error level and sent to Sentry. A read keeps the `AuthenticationError`, which now points only to `CallApi` `organization`.
- The change-log stamping that only `tenant: none` writes used (a record stamped with the organization of the rows it recorded, and the refusal of a multi-document write that could reach several organizations) is removed, since those writes are refused. A `tenant: shared` connection over a walled collection keeps its write guard.
- Connection plugins can declare `requestMetas` (`{ checkRead, checkWrite }` per request type) in their `types.js`, which the build reads to know which request types write. `@lowdefy/connection-mongodb` declares them from the same table its request resolvers carry as `meta`.
