---
'lowdefy': minor
'@lowdefy/api': patch
'@lowdefy/build': minor
'@lowdefy/connection-ai-gateway': minor
'@lowdefy/connection-anthropic': minor
'@lowdefy/connection-axios-http': minor
'@lowdefy/connection-google': minor
'@lowdefy/connection-mcp': minor
'@lowdefy/connection-mongodb': minor
'@lowdefy/connection-openai': minor
'@lowdefy/connection-sendgrid': minor
'@lowdefy/connection-smtp': minor
'@lowdefy/connection-stripe': minor
'@lowdefy/connection-treg': minor
'@lowdefy/node-utils': minor
'@lowdefy/plugin-aws': minor
'@lowdefy/plugin-azure': minor
'@lowdefy/plugin-gcp': minor
'@lowdefy/server-dev': minor
---

feat: Journeys run on named data sets

Journeys can run on named data sets. Declare one in `tests/data/<name>.yaml` with committed fixtures and named users. A journey with `data:` runs against a fresh in-memory MongoDB database of its own, on the running dev server, and your own browser tabs keep using your real database. `user:` and `as:` can name a data set user.

Under a data set no request reaches your real data: every connection reads the run's database, is sunk, or fails the journey. Connection plugins gain a `meta.dataSet` declaration:

- `'redirect'`: the run's database URI and name are merged in (core `MongoDBCollection`).
- `'walled'`: a type that holds no database URI and reaches MongoDB only through the walled client (`walled(connectionId)` with `getWalledCollection` from `@lowdefy/connection-mongodb/walled`) passes unchanged, and the walled connections it names take the run's database.
- `'external'`: an outside service (core `AxiosHttp`, `SendGridMail`, `SMTP`, `Stripe`, the AI providers, `Mcp`, `TregConnection`, `AwsS3Bucket`, `AzureBlobContainer` and `GoogleCloudStorageBucket`). Its requests are still validated and checked, then recorded and answered with `null`, never sent. The run's result lists them as `sunk`, with the connection, request and evaluated request properties (secrets scrubbed). Mail sent to the dev server's mail capture still reaches it, so the `email` step works. A request resolver can declare `meta.dataSet: 'external'` itself, so a connection that holds database access sinks only that request type and runs the rest against the run's database.

A connection whose type declares nothing, such as `Knex`, `Redis`, `Elasticsearch` or `GoogleSheet`, or a redirected connection whose whole `properties` is an operator, fails the journey with an error naming the connection. A data set journey's browser that reaches the dev server on another host fails the step instead of reading your real database. The in-memory store binds a free port from 49152 up, stops with its files removed when the dev server stops, and is replaced after its `mongod` dies.
