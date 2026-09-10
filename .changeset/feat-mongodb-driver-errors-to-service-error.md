---
'@lowdefy/connection-mongodb': minor
'@lowdefy/errors': minor
'@lowdefy/api': minor
'@lowdefy/docs': patch
---

MongoDB driver errors become `ServiceError`s with a code and a hint.

Every MongoDBCollection request now maps a driver failure to a `ServiceError` whose message names the collection and the operation, whose `code` is the MongoDB error code, and whose new `hint` says what to do about it — add `upsert: true` on a duplicate key, index the filter fields on a time limit, grant the database user a role on an authorization failure, and so on.

The driver's raw message is no longer sent to the browser: it can quote values from the document that triggered the error. A `ServiceError`'s cause is now dropped when the error is serialized to the client, so the raw text stays in the server log, where the dev terminal prints it as `Caused by: MongoServerError: …` under the located error line.
