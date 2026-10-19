---
'lowdefy': minor
'@lowdefy/build': minor
'@lowdefy/node-utils': minor
'@lowdefy/server-dev': minor
---

feat: Seeded `generate` for journey data sets, and data sets hold committed documents only

A journey data set can generate documents from a small spec beside its fixtures, the same on every machine:

```yaml
generate:
  seed: 7
  invoices_db:
    count: 400
    fields:
      _id: { sequence: { prefix: inv-, start: 1 } }
      status: { oneOf: [draft, sent, paid], weights: [1, 2, 5] }
      amount: { number: { min: 10, max: 5000, decimals: 2 } }
      issued: { date: { from: 2026-01-01, to: 2026-09-30 } }
      customerId: { ref: customers_db }
```

Field kinds are a literal, `oneOf` with optional weights, `number`, `date`, `text`, `name`, `email` (at reserved example domains), `company`, `sequence` and `ref` (an `_id` from another connection's fixtures or generated documents). A connection that loads more than 1,000 documents gets a warning, never a refusal. `lowdefy test`, `lowdefy data list` and the `lowdefy_run_journey` result report the documents a data set loads. The format is in the dev server's docs endpoint, so a coding agent can write a generator from a short description.

Data set snapshots are removed: the `snapshot` block, `lowdefy data pull`, the snapshot age report, lint rule L7, the `dataPull` environment setting and the build's `environmentGuards: 'all'` option. A data set file with `snapshot:` is refused with a message to move the documents journeys need into `fixtures` or `generate`. Snapshot directories under `.lowdefy/data/` are no longer read and can be deleted.
