---
'@lowdefy/build': patch
'@lowdefy/connection-mongodb': patch
---

fix(build,connection-mongodb): Refuse a `tenant: shared` connection whose change log writes into a walled collection

Under `auth.organizations.policy: tenant`, a `tenant: shared` connection has no tenant verdict, so
the change-log records its writes produce carry no `organization_id`. When the connection's
`changeLog.collection` is a collection a scoped connection reads, those records land in a walled
collection: no walled read can see them, and the tenant preflight refuses to serve the whole app
once the first one is written.

The build now rejects this pairing with an error naming the shared connection, the log
collection and the scoped connection that reads it. Give shared connections their own change-log
collection. The check compares literal collection names and the database properties as authored;
names that resolve at runtime are not checked. `MongoDBCollection` declares the properties that
name its collections in `connectionMetas.tenantTarget`.
