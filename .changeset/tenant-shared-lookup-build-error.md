---
'@lowdefy/build': minor
'@lowdefy/errors': minor
'@lowdefy/server-dev': minor
---

feat: Build error for a tenant-scoped aggregation that joins a `tenant: shared` collection

Under `auth.organizations.policy: tenant` the wall prepends a tenant `$match` into every `$lookup` / `$unionWith` sub-pipeline. A collection declared `tenant: shared` carries no tenant field, so a scoped pipeline that joins it got a filter the collection can never satisfy — the join silently returned `[]`, at build and at runtime.

The build now joins the two facts it already has — which connections are walled, and which collection each `MongoDBCollection` connection names — and refuses a literal pipeline on a tenant-scoped connection whose `$lookup.from`, `$unionWith` / `$unionWith.coll` or `$graphLookup.from` names a collection that belongs to a `tenant: shared` connection, recursing through `$lookup.pipeline`, `$unionWith.pipeline` and `$facet` branches. The error names the shared connection and both fixes: run the pipeline on the shared connection and pass the organization facts in through the request payload, or declare `tenant: authored` and author the organization clause yourself. `tenant: authored` alone does not exempt a request — it covers only entry stages and `$graphLookup`, not `$lookup` sub-pipelines. The check runs on page requests and endpoint steps, and is best-effort: an operator-composed pipeline or collection name is invisible at build.

Suppress it on a request, step or any parent with `~ignoreBuildChecks: [tenant-lookup]`.

`lowdefy dev` now restores the tenant indexes (a new `tenantCollections.json` build artifact) into the just-in-time page build, so this check — and the existing `tenant: authored` entry-stage check on page requests, which was silently inert in dev — run on every page rebuild.
