---
'@lowdefy/blocks-table': minor
'@lowdefy/connection-mongodb': minor
---

feat(blocks-table, connection-mongodb): Table `before` and `after` filters take relative dates

A Table date filter could say "within the last 3 months", but `before` and `after` took only a fixed date, so a saved view such as "not contacted in 3 months" went stale the next day. `before` and `after` now also take the relative value `within` takes, `{ last | next: n, unit: day | week | month | year }`, resolved each time the filter runs: `{ op: before, value: { last: 3, unit: month } }` reads "before 3 months ago". A relative bound compares whole days, in the browser's days in client mode and in the request's `timezone` in `MongoDBTableQuery`. The filter builder offers Date or Relative for `before` and `after`, a date column's filter menu picks `within`, `before` or `after` under Relative, and `MongoDBTableQuery` refuses a bad relative value with the message it gives for `within`.
