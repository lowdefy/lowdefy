---
'@lowdefy/server-dev': minor
---

Read `LOWDEFY_TEST_CONNECTION_OVERRIDES` (JSON, `{ "<connectionId>": { "<property>": <value> } }`) at boot and merge it over the matching connection's `properties` when the request layer reads `build/connections/<id>.json`, so `lowdefy test` can redirect seeded connections to an in-memory database without any app config change. The overridden connection ids are logged once at info level. Unset, nothing changes.
