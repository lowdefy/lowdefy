---
'@lowdefy/connection-mongodb': patch
'@lowdefy/server-dev': patch
---

fix(deps): Update mongodb to 7.8.0

Updates the MongoDB driver to 7.8.0, which fixes a security issue in how host names returned by
`mongodb+srv://` lookups are verified, closes in-use connections on every server when a client
closes, and fixes `insertedIds` for unordered bulk writes that mix inserts with other operations.
The driver no longer connects to MongoDB 4.2 or older servers (end of life since 2023); 4.4 is
now the minimum. The `timeoutMS` client option is deprecated and no longer has any effect; use
`serverSelectionTimeoutMS`, `socketTimeoutMS` or `maxTimeMS` instead.
