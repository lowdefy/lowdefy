---
'@lowdefy/errors': patch
'@lowdefy/api': patch
'@lowdefy/connection-mongodb': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

fix(tenant): a data fault fails one request, never the app; walled writes are checked as stored

Under `auth.organizations.policy: tenant`, one row without an organisation in a walled collection used to make the tenant preflight refuse every request until the server restarted. The preflight now serves the app and reports: one `TenantIntegrityError` log line and one Sentry event per offending collection (tagged with collection, connection and endpoint, grouped by collection). A probe that cannot reach the database logs a warning and retries on the next request.

Every insert into a walled collection (insertOne, insertMany, consecutive-id inserts, upserts, bulk writes, table changes and the version copy of a versioned update) is now read back by `_id` and checked against the organisation the request ran for. A row that is missing the tenant field or carries another organisation is deleted and the request fails with `TenantIntegrityError`. Adds two-organisation tests for table queries with `$lookup`, and a test that `:parallel_for` iterations keep the caller's user and organisation.
