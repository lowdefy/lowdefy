---
'@lowdefy/server-dev': minor
'@lowdefy/connection-mongodb': minor
'@lowdefy/api': patch
'@lowdefy/docs': patch
---

feat(server-dev): `explain: true` on `lowdefy_run_request` and `lowdefy_run_endpoint` returns the effective request.

Between the YAML an agent writes and the query MongoDB runs, operators are evaluated and, on a
tenant-walled connection, the wall rewrites what it received - a `$match` prepended at the root and
inside every `$lookup`/`$unionWith` sub-pipeline, selectors merged, documents stamped. Neither step
was observable. `explain: true` (also accepted by `POST /lowdefy-docs/run-request` and
`POST /lowdefy-docs/run-endpoint`) adds a non-behavioural `explain` trace to the result:

```json
{
  "caller": { "id": "u_1", "organization_id": "org_1", "roles": ["admin"] },
  "connection": { "id": "app_data", "type": "MongoDBCollection", "tenant": { "field": "organization_id", "value": "org_1" } },
  "properties": { "pipeline": [{ "$lookup": { "from": "controls", "as": "c", "pipeline": [] } }] },
  "effective": { "pipeline": [{ "$match": { "organization_id": "org_1" } }, { "$lookup": { "from": "controls", "as": "c", "pipeline": [{ "$match": { "organization_id": "org_1" } }] } }], "options": undefined },
  "rewritten": [
    { "at": "$lookup[0].pipeline", "injected": { "$match": { "organization_id": "org_1" } } },
    { "at": "$match[0]", "injected": { "$match": { "organization_id": "org_1" } } }
  ]
}
```

For an endpoint, `explain` is an array with one entry per request step, each carrying its `stepId`.
`caller` carries exactly `id`, `organization_id` and `roles`. Without the flag nothing is allocated
and the output is unchanged.

`@lowdefy/api`: `callRequest` and `callEndpoint` take an optional `trace` collector, handed to the
request resolver beside `tenant` - a resolver that ignores it behaves exactly as before.
`@lowdefy/connection-mongodb`: every MongoDB request resolver sets `trace.effective` to the value it
sends to the driver, and the tenant wall helpers record each rewrite on `trace.rewritten`
(`{ at, injected }`, or `{ at, audited: true }` for an audited `tenant: authored` stage).
