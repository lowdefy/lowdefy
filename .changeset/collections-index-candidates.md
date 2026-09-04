---
'@lowdefy/build': minor
'@lowdefy/errors': minor
'@lowdefy/connection-mongodb': minor
'@lowdefy/docs': minor
---

feat: `collections.<name>.indexes` has consumers: derived index candidates and `MongoDBCreateIndexes`

`lowdefy check` derives the indexes an app's own queries need (each request's `query`, `filter`, `options.sort` and the leading `$match`/`$sort` stages of an aggregation, plus `$lookup` joins) and warns under `collections-index` for any key set no declared index covers, naming the request or endpoint step and printing the `indexes:` entry to paste in, ordered equality-then-sort-then-range and including the tenant field the tenant wall merges in at runtime. Key-shaped single-field lookups and declared indexes the app never queries are reported at `debug` only. The `MongoDBCreateIndexes` request type creates declared indexes from a migration step and returns their names; it is idempotent. There is deliberately no request type that drops an index: an index this app no longer queries may be the one another consumer depends on, so removal stays a hand operation.
