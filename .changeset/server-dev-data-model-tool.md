---
'@lowdefy/server-dev': minor
'@lowdefy/docs': patch
---

feat(server-dev): Add the `lowdefy_data_model` MCP tool and `GET /lowdefy-docs/data-model`.

One call prints the app's data layer from the build artifacts: every collection (declared under
`collections:`, named by a connection, or joined by a literal pipeline) with its `fields`,
`relations`, `indexes` and tenant verdict (declared, agreed by its connections, or a spelled-out
`conflict`), the connections addressing it with `read` / `write` / `tenant`, and every page request,
routine step and websocket that reads or writes it, each with the yaml `file:line` that defines it.
Readers and writers are classified by the request type's own `checkRead` / `checkWrite` meta, plus
`$lookup` / `$graphLookup` / `$unionWith` (read) and `$merge` / `$out` (write) in literal
aggregation pipelines. Anything that could not be joined is listed under `unresolved` with a reason
rather than dropped. The connection-to-collection join is shared through
`lib/docs/resolveCollectionJoin.js` for write validation and migrations to reuse.
