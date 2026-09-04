---
'@lowdefy/build': minor
'@lowdefy/docs': patch
---

A connection written as a file plugin can now declare its tenant capability. Add `"meta": { "tenant": true }` to the connection's sibling JSON (`plugins/connections/<Type>/<Type>.json`), the file-plugin spelling of a connection package's `connectionMetas`, and the connection is treated exactly like a package connection under `auth.organizations.policy: tenant`: scoped by default, opting out with `tenant: shared`, and included in the tenant artifacts. `"tenant": false` marks a type as non-scopable. A type that declares neither is still refused under the tenant policy, and a `meta.tenant` that is not a boolean is a build error naming the JSON file. A stale dev `customTypesMap.json` can no longer keep a deleted file connection's meta alive.
