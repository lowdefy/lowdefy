---
'@lowdefy/api': patch
'@lowdefy/build': patch
'@lowdefy/connection-mongodb': patch
---

fix(api,build,connection-mongodb): Check writes of `tenant: shared` connections over a walled collection

Under `auth.organizations.policy: tenant`, a `tenant: shared` connection whose collection is also read by a scoped connection could write rows without an `organization_id` into that collection, which made the tenant preflight refuse to serve the app. The build now marks such connections (same collection and database as a scoped connection, compared as authored), and their writes get the same check as a `tenant: none` write: every row they insert, replace, upsert or update must keep a non-empty `organization_id`. Their reads stay unscoped. A collection name resolved at runtime can not be compared and is not marked.

The tenant verdict and the unscoped write guard are now resolved by one function, so every request path (page requests, routine steps, webhook verifiers, websockets) gets both.
