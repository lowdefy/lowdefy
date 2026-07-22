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
- Aggregation pipelines: the wall's one pipeline move is prepending the tenant `$match` at every pipeline entry — the root pipeline and every `$lookup` (both forms) / `$unionWith` sub-pipeline entry, recursing through `$facet` branches. The wall never rewrites the inside of a stage. `$out`/`$merge` are rejected on tenant connections, and `$collStats`/`$indexStats` too — collection-level statistics cannot be tenant-scoped.
- Stages the prepend cannot scope — a pipeline-leading `$search`/`$searchMeta`/`$vectorSearch`/`$geoNear`, and `$graphLookup` at any position — are **refused** unless the request declares `tenant: authored`: the request then authors the tenant clause itself (a `compound.filter` `equals` for `$search`/`$searchMeta`, the `filter` for `$vectorSearch`, the `query` for `$geoNear`, `restrictSearchWithMatch` for `$graphLookup`, typically with `_user: organizationId` as the value), and the wall **audits** it at runtime — clause present, tenant field, value strictly equal to the caller's resolved organization — refusing to run on any miss. The rest of an authored request's pipeline is still walled mechanically, and the caller must still resolve an organization. Atlas index requirements for authored clauses: the tenant field `token`-mapped in the Atlas Search index (and in `storedSource` where `returnStoredSource` is used); indexed as the `filter` type for Atlas Vector Search.
- Change streams are scoped via a `fullDocument` match with `updateLookup` forced; events that cannot prove they match (deletes) are not delivered, and callers from different organizations never share a change-stream channel.
- The tenant field may be read but never authored in a write or filter position — authored usage is rejected loudly. (On a `tenant: authored` request the audited stage position is the one place it is instead *required*.)
- Fail-closed everywhere: system-context and strategy callers carry no organization, so requests to tenant connections fail unless the request explicitly declares `tenant: none`, the only opt-out, authored at the point of use.
- `context.user.organizationId` (the caller's active organization id) is now exposed and readable as `_user: organizationId` under both organizations policies.

**Build validation (`@lowdefy/build`)**

- `tenant:` is validated on connections and gated to connection types that implement the scoping contract (v1: `MongoDBCollection`) — declaring it on any other type is a build error.
- The request/step-level sentinel accepts `none` and `authored`; websockets accept `none` only (`authored` is aggregation-only).
- Best-effort entry-stage check: a literal walled pipeline leading with `$search`/`$searchMeta`/`$vectorSearch`/`$geoNear` or containing `$graphLookup` without `tenant: authored` is a build error (operator-composed pipelines are checked at runtime, which is the enforcement gate).

**Enabling the wall on an existing connection**

Declaring `tenant:` on a connection with existing data is deliberately breaking, in the fail-closed direction:

- Documents without the tenant field fall outside every walled read — backfill the field on existing documents before (or immediately after) enabling the wall.
- Every system-context caller of the connection (webhook verifiers, hook routines, scheduled endpoints) and every strategy caller starts failing with an `AuthenticationError` until it either runs with an organization or declares `tenant: none` at the point of use.
