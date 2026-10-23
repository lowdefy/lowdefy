---
'@lowdefy/blocks-table': minor
---

feat(blocks-table): Table server mode loads rows from an API endpoint with `data.endpoint`

Server mode loaded rows only from a request on the page, so an app whose data may only be read behind an endpoint's own checks could not use it. `data: { mode: server, endpoint }` now names an API endpoint in place of `request`: the table calls it with `CallAPI`, with the fetch event `{ startRow, endRow, view, groupPath, selected }` as its payload, and reads the routine's `{ rows, total, groups?, aggregates? }`, the shape `MongoDBTableQuery` returns. Give exactly one of `request` and `endpoint`. A response without rows shows the table's own error row.
