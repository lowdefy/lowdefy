# @lowdefy/connection-treg

## 7.2.0

### Patch Changes

- Updated dependencies [df6fa3c]
- Updated dependencies [31d7de8]
- Updated dependencies [dd5c2b1]
- Updated dependencies [61ae799]
- Updated dependencies [f0209f6]
- Updated dependencies [7c85b4b]
- Updated dependencies [3cd6d62]
- Updated dependencies [7aec569]
- Updated dependencies [b1d42ca]
  - @lowdefy/errors@7.2.0
  - @lowdefy/helpers@7.2.0

## 7.1.0

### Patch Changes

- @lowdefy/errors@7.1.0
- @lowdefy/helpers@7.1.0

## 7.0.0

### Minor Changes

- 2595439: `@lowdefy/connection-treg`: call treg's catalog of external API endpoints from server routines

  [treg](https://treg.to) puts thousands of external API endpoints (enrichment, SEO and SERP data, social data, scraping, generation) behind one token. The new `TregConnection` connection is a default type, so apps use it without installing a plugin.

  - **`TregCall`** calls a catalog or routed endpoint by id, such as `treg.people.email.find`. It takes `query`, `body`, an `idempotencyKey` (a retry gets the stored answer and is not charged again), a `maxCost` ceiling in USD, cache and routing options, and `meta` tags for per-customer usage. It returns `output`, `raw`, the charged `cost` in micro-USD and USD, the `callId`, the provider that served it and those tried. With `await`, it polls an async task until it is done. Upstream URLs are never accepted as endpoints, and the team's own registered tools need `allowCustomTools: true` on the connection.
  - **`TregCatalogSearch`**, **`TregCatalogGet`** (with `access: true`, the team's price) and **`TregBalance`** for admin pages and provider catalogues.
  - A balance that is too low or a call over `maxCost` is a final error. A rate limit, a busy or out-of-capacity treg and a network failure are a `ServiceError` with `retryAfter`, the seconds treg asked to wait. A treg 422 is a `ConfigError`. Error messages never contain the token, a provider's response body or the top-up link.

  A `:catch` can now read a `ServiceError`'s wait as `_error: retryAfter`.

  `MongoDBEnrichmentComplete` results take a `cost` in micro-USD, stored as the cell's `cost`, and the `Table` cell details panel shows it. An enrichment provider backed by treg returns `TregCall`'s `cost.micro` there. A retried error result can also take `retryAfterMs`, which replaces the exponential backoff (at most a day), so a worker waits as long as treg's `retry_after` asks.

- 4cc0f36: feat: Journeys run on named data sets

  Journeys can run on named data sets. Declare one in `tests/data/<name>.yaml` with committed fixtures and named users. A journey with `data:` runs against a fresh in-memory MongoDB database of its own, on the running dev server, and your own browser tabs keep using your real database. `user:` and `as:` can name a data set user.

  Under a data set no request reaches your real data: every connection reads the run's database, is sunk, or fails the journey. Connection plugins gain a `meta.dataSet` declaration:

  - `'redirect'`: the run's database URI and name are merged in (core `MongoDBCollection`).
  - `'walled'`: a type that holds no database URI and reaches MongoDB only through the walled client (`walled(connectionId)` with `getWalledCollection` from `@lowdefy/connection-mongodb/walled`) passes unchanged, and the walled connections it names take the run's database.
  - `'external'`: an outside service (core `AxiosHttp`, `SendGridMail`, `SMTP`, `Stripe`, the AI providers, `Mcp`, `TregConnection`, `AwsS3Bucket`, `AzureBlobContainer` and `GoogleCloudStorageBucket`). Its requests are still validated and checked, then recorded and answered with `null`, never sent. The run's result lists them as `sunk`, with the connection, request and evaluated request properties (secrets scrubbed). Mail sent to the dev server's mail capture still reaches it, so the `email` step works. A request resolver can declare `meta.dataSet: 'external'` itself, so a connection that holds database access sinks only that request type and runs the rest against the run's database.

  A connection whose type declares nothing, such as `Knex`, `Redis`, `Elasticsearch` or `GoogleSheet`, or a redirected connection whose whole `properties` is an operator, fails the journey with an error naming the connection. A data set journey's browser that reaches the dev server on another host fails the step instead of reading your real database. The in-memory store binds a free port from 49152 up, stops with its files removed when the dev server stops, and is replaced after its `mongod` dies.

### Patch Changes

- Updated dependencies [f7fa621]
- Updated dependencies [099d412]
- Updated dependencies [4d08b55]
- Updated dependencies [6144814]
- Updated dependencies [db1a4d3]
- Updated dependencies [04077d9]
- Updated dependencies [d42f420]
- Updated dependencies [ebf95f8]
- Updated dependencies [2595439]
- Updated dependencies [f9e483f]
- Updated dependencies [09717e8]
- Updated dependencies [2baefc1]
- Updated dependencies [662eaa9]
- Updated dependencies [bfc6a00]
- Updated dependencies [b226c43]
- Updated dependencies [239a3a7]
- Updated dependencies [1766343]
- Updated dependencies [a34939d]
- Updated dependencies [e6302c6]
- Updated dependencies [aa6bb38]
- Updated dependencies [94fc9e0]
- Updated dependencies [81bd4f0]
- Updated dependencies [2755501]
- Updated dependencies [cac0798]
- Updated dependencies [9512788]
  - @lowdefy/helpers@7.0.0
  - @lowdefy/errors@7.0.0
