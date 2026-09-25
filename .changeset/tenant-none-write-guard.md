---
'@lowdefy/api': minor
'@lowdefy/connection-mongodb': minor
---

fix(api,connection-mongodb): Refuse `tenant: none` writes that would leave a row without an organization

Under `auth.organizations.policy: tenant`, a request that opts out of the tenant wall with
`tenant: none` was neither filtered nor stamped - and nothing checked what it wrote. An insert
could land a row with a null or missing `organization_id` in a walled collection. No walled read
can see that row, and the tenant preflight then refuses to serve the whole app on the next cold
start - one bad write became a full outage.

`tenant: none` writes on a walled MongoDB connection must now leave the tenant field a non-empty
organization id on every row they write: inserted and replacement documents must carry it,
upserts must author it (`$set`/`$setOnInsert`, or an equality match in the filter), and updates
may not null, unset, rename or otherwise overwrite it with a value the wall can not verify.
Otherwise the request fails with an error naming it. Filters stay unscoped. Data that belongs to
no organization belongs on a `tenant: shared` connection.
