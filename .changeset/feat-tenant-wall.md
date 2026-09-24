---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/connection-mongodb': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
'@lowdefy/server-e2e': minor
'@lowdefy/connection-ai-gateway': minor
'@lowdefy/connection-anthropic': minor
'@lowdefy/connection-axios-http': minor
'@lowdefy/connection-elasticsearch': minor
'@lowdefy/connection-google': minor
'@lowdefy/connection-google-sheets': minor
'@lowdefy/connection-knex': minor
'@lowdefy/connection-mcp': minor
'@lowdefy/connection-openai': minor
'@lowdefy/connection-redis': minor
'@lowdefy/connection-sendgrid': minor
'@lowdefy/connection-smtp': minor
'@lowdefy/connection-stripe': minor
'@lowdefy/connection-test': minor
'@lowdefy/plugin-aws': minor
'@lowdefy/plugin-azure': minor
'@lowdefy/plugin-gcp': minor
---

feat: Tenant wall — multi-tenant isolation on MongoDB connections, scoped by default

`auth.organizations.policy` sets the scoping default for every connection in the app. Under `policy: tenant`, every connection whose type implements the scoping contract is walled to the caller's active organization — enforced mechanically on reads **and** writes, with nothing to declare per connection and no per-request filters to remember. A connection declares only its **exception** to that default: `tenant: shared`, for data deliberately shared across organizations, or `tenant: { field: ... }` to scope on a non-default field. A connection carries no default of its own — the same connection file is scoped in a `tenant` app and unscoped in a `pinned` one, with nothing in the file about tenancy.

**The wall is policy-conditional.** It engages only when the app declares `auth.organizations.policy: tenant`. Under `pinned` (the default, including apps with no `organizations:` block) no connection is scoped and none can be — the wall applies nothing: no read filter, no write stamp, no selector merge, no change-stream scoping, no authored-clause audit, no fail-closed error for organization-less callers, and no rejection of an authored tenant field. A single-organization deployment therefore adopts scoping-capable connections with no data migration — no backfill, no index changes. One check stays on under both policies: declaring `tenant:` on a connection type that does not implement the scoping contract is still a config error, so it surfaces on the current deployment rather than on the day the app flips to `tenant`. `_build.authConfig` now also projects `organizations.policy`, so config can branch on the policy at build time — and the operator now resolves in module entry vars and cross-module components consumed through them: build walks that run before the auth-config projection exists defer the fold to the walk that consumes the value, instead of erroring. (Reading it inside the `auth:` block itself, or in app metadata, is still a build error.)

**Flip preflight.** A deployment that flips `pinned` → `tenant` starts enforcing over existing rows, and any document without the tenant field falls silently outside every walled read. To make that loud instead of blank, the server now runs a tenant preflight (lazily, once per process) under `policy: tenant`: every walled collection is probed for documents missing the tenant field (or carrying it as `null`), and the server refuses to serve — with one aggregated error naming the collections to backfill — until the backfill runs and the server restarts. Probe connectivity failures retry on the next request; the refusal itself is memoized until restart. The probe is a connection-type capability (`tenantPreflight`, implemented by `MongoDBCollection`); the walled set — every scoping-capable connection that does not declare `tenant: shared` — is enumerated from the new `tenantConnections.json` build artifact, so builds from older versions skip the preflight with a warning.

**Tenant wall (`@lowdefy/connection-mongodb`, `@lowdefy/api`)**

- Every find/findOne/update/delete selector is merged with the caller's organization equality; every insert, replacement, and upsert is stamped server-side with the organization id.
- Aggregation pipelines: the wall's one pipeline move is prepending the tenant `$match` at every pipeline entry — the root pipeline and every `$lookup` (both forms) / `$unionWith` sub-pipeline entry, recursing through `$facet` branches. The wall never rewrites the inside of a stage. `$out`/`$merge` are rejected on tenant connections, and `$collStats`/`$indexStats` too — collection-level statistics cannot be tenant-scoped.
- Stages the prepend cannot scope — a pipeline-leading `$search`/`$searchMeta`/`$vectorSearch`/`$geoNear`, and `$graphLookup` at any position — are **refused** unless the request declares `tenant: authored`: the request then authors the tenant clause itself (a `compound.filter` `equals` for `$search`/`$searchMeta`, the `filter` for `$vectorSearch`, the `query` for `$geoNear`, `restrictSearchWithMatch` for `$graphLookup`, typically with `_user: organization_id` as the value), and the wall **audits** it at runtime — clause present, tenant field, value strictly equal to the caller's resolved organization — refusing to run on any miss. The rest of an authored request's pipeline is still walled mechanically, and the caller must still resolve an organization. Atlas index requirements for authored clauses: the tenant field `token`-mapped in the Atlas Search index (and in `storedSource` where `returnStoredSource` is used); indexed as the `filter` type for Atlas Vector Search.
- Change streams are scoped via a `fullDocument` match with `updateLookup` forced; events that cannot prove they match (deletes) are not delivered, and callers from different organizations never share a change-stream channel.
- The tenant field may be read but never authored in a write or filter position — authored usage is rejected loudly. (On a `tenant: authored` request the audited stage position is the one place it is instead *required*.)
- Fail-closed everywhere under `policy: tenant`: system-context and strategy callers carry no organization, so requests to tenant connections fail unless the request explicitly declares `tenant: none`, the only opt-out, authored at the point of use.
- `context.user.organization_id` (the caller's active organization id) is now exposed and readable as `_user: organization_id` under both organizations policies.

**Build validation (`@lowdefy/build`)**

- The connection position accepts only the exception: `tenant: shared`, or `tenant: { field: ... }`. `tenant: true` was removed — under the inverted default it restates the default — and is a build error naming its replacement. Any `tenant:` declaration on a connection type that does not implement the scoping contract stays a build error under both policies.
- Connection types declare their tenancy capability in `connectionMetas`: `{ tenant: true }` implements the scoping contract (v1: `MongoDBCollection`), `{ tenant: false }` is non-scopable — every first-party connection type now declares one or the other. Under `policy: tenant` a connection whose type declares neither is a build error naming the type, so a data-bearing custom type can never be silently unscoped.
- The request/step-level sentinel accepts `none` and `authored`; websockets accept `none` only (`authored` is aggregation-only). Declaring `none`/`authored` on a connection, or `shared`/`{ field }` on a request, is a build error naming the position the value belongs to.
- Best-effort entry-stage check: a literal walled pipeline leading with `$search`/`$searchMeta`/`$vectorSearch`/`$geoNear` or containing `$graphLookup` without `tenant: authored` is a build error (operator-composed pipelines are checked at runtime, which is the enforcement gate). The check only runs under `policy: tenant` — under `pinned` the wall never engages, so a missing authored clause is not an error.
- Remap guard: a connection remap on a module entry swaps the module's whole connection definition for the app's — including its position against the wall. Under `policy: tenant`, remapping a scoped module connection to a target that is not scoped — one that declares `tenant: shared`, or whose type does not implement the scoping contract — is a build error (it would silently run the module's requests outside the wall). Remapping onto a target that declares nothing is safe: both sides are scoped. Under `pinned` remaps stay unrestricted; the flip to `tenant` is a rebuild, so the guard fires there.

**Enabling the wall**

Under `pinned`, adopting scoping-capable connections changes nothing — no migration, no new requirements, no declaration. Enforcement starts when the app declares `policy: tenant`, and that flip is deliberately breaking, in the fail-closed direction:

- Documents without the tenant field fall outside every walled read — the flip preflight refuses to serve until the field is backfilled on existing documents.
- Every system-context caller of the connection (webhook verifiers, hook routines, scheduled endpoints) and every strategy caller starts failing with an `AuthenticationError` until it either runs with an organization or declares `tenant: none` at the point of use. Declaring `tenant: none` is inert under `pinned`, so authoring it ahead of the flip is safe and recommended wherever a caller-less context reads a walled connection.
