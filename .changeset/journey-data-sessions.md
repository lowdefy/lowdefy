---
'lowdefy': minor
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
'@lowdefy/server-dev': minor
---

feat: Journeys run on named data sets

Journeys can run on named data sets. Declare one in `tests/data/<name>.yaml` with fixtures, named users and, optionally, a snapshot of a pre-production database pulled with `lowdefy data pull <name>`. The pull copies only the connections the data set lists, can omit fields, reads only from an environment that sets `dataPull: true`, and is guarded by the environment's `guards.secrets` pins. A journey with `data:` runs against a fresh in-memory MongoDB database of its own, on the running dev server, and your own browser tabs keep using your real database. `user:` and `as:` can name a data set user.

Under a data set every connection either reads the run's database or the journey fails, never your real data. Connection plugins gain a `meta.dataSet` declaration: `'redirect'` (the run's database URI and name are merged in; core `MongoDBCollection`) or `'external'` (an outside service that keeps its real target; core `AxiosHttp`, `SendGridMail`, `SMTP`, `Stripe`, the AI providers, `Mcp` and `TregConnection`). A connection whose type declares neither, such as `Knex`, `Redis`, `Elasticsearch` or `GoogleSheet`, or a redirected connection whose whole `properties` is an operator, fails the journey with an error naming the connection. A data set journey's browser that reaches the dev server on another host fails the step instead of reading your real database. The in-memory store binds a free port from 49152 up, stops with its files removed when the dev server stops, and is replaced after its `mongod` dies.
