---
'@lowdefy/connection-mongodb': patch
---

fix: Reuse the MongoDB client across requests instead of connecting per request.

MongoDBCollection requests previously created a new MongoDB client, performed a full connection handshake (DNS, TLS, auth), and closed the connection for every request. Requests now share one cached client per unique `databaseUri` and `options` combination, so multi-request pages and routines no longer pay a connection setup per request — an 8-request routine measured against MongoDB Atlas dropped from 4.3s to 0.2s (~95% faster). Connections now stay open between requests; the driver's connection pool can be tuned with standard client options like `maxPoolSize` and `maxIdleTimeMS` on the connection's `options` property.
