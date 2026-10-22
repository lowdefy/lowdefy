---
'@lowdefy/connection-mongodb': minor
---

feat(connection-mongodb): `changeLog.omit` keeps named fields out of change log records

A MongoDB change log record copies the update and the before and after documents, so text stored on a document outlived the document in the log collection after it was deleted. A connection can now set `changeLog.omit`, a list of top-level fields: every record a write logs has `"[omitted]"` in place of those fields' values in `before`, `after`, the inserted documents, each update operator or pipeline stage, and a `MongoDBTableChanges` changeset. The record still shows which fields a write set, who made it and when. Without `omit`, records are as before.
