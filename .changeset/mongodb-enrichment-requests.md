---
'@lowdefy/connection-mongodb': minor
---

`MongoDBEnrichmentEnqueue`, `MongoDBEnrichmentClaim` and `MongoDBEnrichmentComplete`: a run queue for enrichment columns

Enrichment columns compute each row's cell from other columns, with a provider endpoint of your app or an AI prompt. The three requests keep each cell's run state in its row, under `_enrich.<column key>`:

- **`MongoDBEnrichmentEnqueue`** queues the cells of some columns for the selected rows (row keys, or the `Table` selection `{ all, except, filter, search }`). `mode` picks the cells: `all`, `empty`, `errors` or `stale` (the inputs changed since the value was computed). It never restarts a cell that is queued or running. A row with a missing input gets `status: empty` and `Missing input: <column>` instead. A column can run with the columns it reads: its cells wait for them (`waitingFor`) instead of finding their input missing. It writes nothing when more than `maxCells` (10,000) cells would change.
- **`MongoDBEnrichmentClaim`** hands a worker the oldest queued cells, each with a lease, a claim token, the row, the resolved inputs and the column config the worker needs (`kind`, `title`, `provider`, `prompt`, `output`). Concurrent workers never get the same cell, and a cell whose worker crashed is claimed again when its lease runs out.
- **`MongoDBEnrichmentComplete`** writes the results. A result counts only while its claim still holds. A failed attempt is retried with an exponential backoff until `maxAttempts`. Large `raw` responses are stored truncated. It releases the cells waiting for a finished cell and queues the `autoRun` columns an ok cell feeds. `error: null` and `retry: null` mean not given.

Column inputs can only read fields in the table's `fields` or other enrichment columns. The requests only write `_enrich` cell state, and every read and write is scoped by the base `filter` and the tenant. The MongoDB docs include the worker endpoint: claim, call the providers with `:parallel_for` and `:concurrency`, complete, on a one-minute schedule. Read the columns on the server in every endpoint, never from the payload.
