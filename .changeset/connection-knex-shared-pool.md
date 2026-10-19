---
'@lowdefy/connection-knex': patch
---

fix(connection-knex): Share one connection pool per connection instead of opening one per request

Every KnexRaw and KnexBuilder request created a new knex instance, and with it a new connection pool that was never destroyed. Idle database connections kept piling up until the database refused new ones (reported on PostgreSQL). Knex instances are now cached for the lifetime of the server process, keyed by the connection config, so all requests to the same connection share one pool. Fixes #1512.
