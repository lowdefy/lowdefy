---
'@lowdefy/connection-mongodb': minor
---

feat(connection-mongodb): `changeLog.exclude` keeps named fields out of change log records

A MongoDB change log record copies the update and the before and after documents, so a secret a collection must hold, such as a credential hash or an OAuth token, was copied into the log collection, where it lived as long as the log did. A connection can now set `changeLog.exclude`, a list of field paths: every record a write logs has `"[excluded]"` in place of those fields' values in `before`, `after`, the inserted documents, each update operator or pipeline stage, and a `MongoDBTableChanges` changeset. A dot path names a nested field, a path through an array names the field in each element, and an update key at or under a path (`tokens.refresh.value`, `sessions.$.token`) is excluded too. In an update pipeline, `$mergeObjects` and `$literal` documents are walked and any other expression that sets a field above a path is excluded whole. `_enrich` or `_enrich.<columnKey>` excludes enrichment cell values, and the walled client's `findOneAndUpdate` records are covered too. The record still shows which fields a write set, who made it and when. The filter and the request payload are logged as they are. Without `exclude`, records are as before.

```yaml
connections:
  - id: users
    type: MongoDBCollection
    properties:
      databaseUri:
        _secret: MONGODB_URI
      collection: users
      write: true
      changeLog:
        collection: log-changes
        exclude:
          - pin_hash
          - tokens.refresh
```
