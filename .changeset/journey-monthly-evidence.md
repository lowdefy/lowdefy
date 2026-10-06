---
'lowdefy': minor
'@lowdefy/node-utils': patch
---

feat(cli): Journey production evidence builds up by calendar month

`lowdefy journeys evidence --refresh` no longer overwrites one 30-day window. A journey's `evidence.production` now holds one entry per UTC calendar month (`month`, `days`, `sessions`, `persons`, `orgs`, `failures`), so counts build up across pulls and machines without double counting:

- A refresh reads every final day of the production cache, gaps included, instead of a window. Today and yesterday count once a later pull marks them final. The `--since`, `--from` and `--to` options are gone from `journeys evidence`.
- A month is rewritten only when the cache holds at least as many final days of it as the committed entry. Refreshing twice changes nothing, a fuller pull from a colleague wins, and a cache that never held a month, or pruned it, leaves that month as committed. A routine refresh reads only the current month.
- A session counts in the month it started, once, even when it crosses midnight. A month read with no backing session is written with `sessions: 0`.
- `share` and `window` are gone. A `production` block in the old shape still validates, and the next refresh replaces it with months.

Each journey's production evidence also records the flow it was counted for (`sequence`, `pageId` and `flow`). When an edit changes what the journey matches in production (a click's text or block, the step order, a `goto`, or an `expect.url` path that moves later steps), the next refresh moves the counted months to a `deprecated` flow and counts the new flow from the cache. A deprecated flow is never run and is still counted on every refresh, so you can see whether users keep following the old way. Undoing the edit makes it live again. Waits, other expectations, typed values, rows and `nth` do not change the flow.

A journey file accepts `deprecated: true` at its top level, for a flow being retired from the app. Refresh keeps counting it.

The list of journeys with no production backing now reads the last 3 calendar months.
