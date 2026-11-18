---
'@lowdefy/server-dev': patch
---

fix(deps): Update mongodb-memory-server-core to 11.3.0

The dev server's journey data store (the in-memory MongoDB replica set that journey data sets load into) now runs on mongodb-memory-server-core 11.3.0, which checks downloaded MongoDB binaries against their checksums and resumes interrupted downloads. Its default MongoDB version moves from 6.0.14 to 8.2.6, so the first data set journey after the update downloads MongoDB 8.2.6 once. Set `MONGOMS_VERSION` to keep the store on your cluster's MongoDB version, as before.
