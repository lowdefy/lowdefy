---
'@lowdefy/connection-treg': minor
'@lowdefy/build': patch
'@lowdefy/connection-mongodb': minor
'@lowdefy/blocks-table': patch
'@lowdefy/helpers': minor
---

`@lowdefy/connection-treg`: call treg's catalog of external API endpoints from server routines

[treg](https://treg.to) puts thousands of external API endpoints (enrichment, SEO and SERP data, social data, scraping, generation) behind one token. The new `TregConnection` connection is a default type, so apps use it without installing a plugin.

- **`TregCall`** calls a catalog or routed endpoint by id, such as `treg.people.email.find`. It takes `query`, `body`, an `idempotencyKey` (a retry gets the stored answer and is not charged again), a `maxCost` ceiling in USD, cache and routing options, and `meta` tags for per-customer usage. It returns `output`, `raw`, the charged `cost` in micro-USD and USD, the `callId`, the provider that served it and those tried. With `await`, it polls an async task until it is done. Upstream URLs are never accepted as endpoints, and the team's own registered tools need `allowCustomTools: true` on the connection.
- **`TregCatalogSearch`**, **`TregCatalogGet`** (with `access: true`, the team's price) and **`TregBalance`** for admin pages and provider catalogues.
- A balance that is too low or a call over `maxCost` is a final error. A rate limit, a busy or out-of-capacity treg and a network failure are a `ServiceError` with `retryAfter`, the seconds treg asked to wait. A treg 422 is a `ConfigError`. Error messages never contain the token, a provider's response body or the top-up link.

A `:catch` can now read a `ServiceError`'s wait as `_error: retryAfter`.

`MongoDBEnrichmentComplete` results take a `cost` in micro-USD, stored as the cell's `cost`, and the `Table` cell details panel shows it. An enrichment provider backed by treg returns `TregCall`'s `cost.micro` there. A retried error result can also take `retryAfterMs`, which replaces the exponential backoff (at most a day), so a worker waits as long as treg's `retry_after` asks.
