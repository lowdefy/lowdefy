---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/connection-mongodb': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/server-e2e': minor
---

feat: Tenant wall — declarative multi-tenant isolation on MongoDB connections

A connection can now declare `tenant: true` (or `tenant: { field: ... }`) to wall all its data access to the caller's active organization — enforced mechanically on reads **and** writes, with no per-request filters to remember.

**Tenant wall (`@lowdefy/connection-mongodb`, `@lowdefy/api`)**

- Every find/findOne/update/delete selector is merged with the caller's organization equality; every insert, replacement, and upsert is stamped server-side with the organization id.
- Aggregation pipelines get recursive injection at every cross-collection stage — `$lookup` (both forms), `$unionWith`, `$graphLookup` (`restrictSearchWithMatch`), and inside `$facet` branches. `$out`/`$merge` are rejected on tenant connections.
- Atlas Search support: a pipeline-leading `$search`/`$searchMeta` is rewritten in place with the tenant equality as a `compound.filter` `equals` clause, keeping relevance ordering and `$search`-computed counts tenant-correct. Requires the tenant field to be `token`-mapped in the Atlas Search index (and in `storedSource` where `returnStoredSource` is used).
- Change streams are scoped via a `fullDocument` match with `updateLookup` forced; events that cannot prove they match (deletes) are not delivered, and callers from different organizations never share a change-stream channel.
- The tenant field may be read but never authored in a write or filter position — authored usage is rejected loudly.
- Fail-closed everywhere: system-context and strategy callers carry no organization, so requests to tenant connections fail unless the request explicitly declares `tenant: none`, the only opt-out, authored at the point of use.
- `context.user.organizationId` (the caller's active organization id) is now exposed and readable as `_user: organizationId` under both organizations policies.

**Build validation (`@lowdefy/build`)**

- `tenant:` is validated on connections and gated to connection types that implement the scoping contract (v1: `MongoDBCollection`) — declaring it on any other type is a build error.
- `tenant: none` is validated as the only request/step/websocket-level value.
