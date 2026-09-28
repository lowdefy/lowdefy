---
'@lowdefy/connection-mongodb': patch
---

fix(connection-mongodb): The MongoDB auth adapters recover from a failed first connect. `MongoDBAdapter` handed Auth.js a single connect promise, which stayed rejected after one failed connect, and `MultiAppMongoDBAdapter` kept reusing a client whose topology the driver had closed. Either way, one timed-out handshake (a serverless instance frozen mid-connect, a network blip) left every sign-in and session call on that process failing until the instance was recycled. Both adapters now get their client from the same process-wide cache as `MongoDBCollection` connections, which drops a client whose connect failed, so only the request that hit the failed connect errors. An auth adapter and `MongoDBCollection` connections with the same URI and client options now share one connection pool.
