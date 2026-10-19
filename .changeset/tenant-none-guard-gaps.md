---
'@lowdefy/api': patch
'@lowdefy/connection-mongodb': patch
---

fix(api,connection-mongodb): Close three ways a `tenant: none` write could still leave a row without an organization.

The `tenant: none` write guard missed three writes that land a row without `organization_id` in a walled collection, which then makes the tenant preflight refuse to serve the app:

- A `MongoDBBulkWrite` operation naming two kinds (for example `deleteOne` and `insertOne`). The guard checked the first kind, while the driver ran the insert. An operation must now name exactly one kind.
- A pipeline update with `{ $project: { _id: 1 } }`, which keeps only `_id`. The guard read it as an exclusion projection.
- A `MongoDBVersionedUpdateOne` whose `options.find.projection` leaves the organization id out of the matched document. The version copy it inserts is now checked like any inserted row.

A webhook `verify` request with `tenant: none` now gets the same guard as other `tenant: none` requests.
