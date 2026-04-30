---
'@lowdefy/actions-core': minor
'@lowdefy/engine': minor
'@lowdefy/operators-js': patch
---

feat(actions): `holdValue` flag on `Request` and `CallAPI` actions.

`Request` and `CallAPI` actions now accept a `holdValue: true` flag that retains the previous response value while a new call is loading. UI bound to `_request: <id>` or `_api: <endpointId>` keeps showing the previous response instead of flashing to `null` during a refetch. The previous response is also retained if the new call errors — the error is still observable via `_request_details` / `_api`.

```yaml
- id: refresh_table
  type: Request
  params:
    requestId: my_table_request
    holdValue: true
```

The `Request` action's object-form params now also support `{ requestId, holdValue }` and `{ requestIds, holdValue }` shapes alongside the existing `{ all }` shape.
