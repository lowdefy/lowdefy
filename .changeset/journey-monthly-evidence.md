---
'lowdefy': minor
'@lowdefy/node-utils': patch
---

feat(cli): Journey production evidence builds up by calendar month

A journey's `evidence.production` holds one entry per UTC calendar month (`month`, `days`, `sessions`, `persons`, `orgs`, `failures`), so counts build up across pulls and machines without double counting:

- `lowdefy journeys evidence --refresh` reads every final day of the production cache, gaps included. Today and yesterday count once a later pull marks them final. A routine refresh reads only the current month.
- A month is rewritten only when the cache holds more final days of it than the committed entry. Refreshing twice changes nothing, a fuller pull from a colleague wins, and a cache that never held a month, or pruned it, leaves that month as committed.
- A session counts in the month it started, once, even when it crosses midnight. A month read with no backing session is written with `sessions: 0`.
- A renamed click label keeps its history: clicks resolve to any click text a committed flow already holds.

Each journey's production evidence also records the flow it was counted for (`sequence`, `pageId` and `flow`). When an edit changes what the journey matches in production (a click's text or block, the step order, a `goto`, or an `expect.url` path that moves later steps), the next refresh moves the counted months to a `deprecated` flow and counts the new flow from the cache. A deprecated flow is never run and is still counted on every refresh, so you can see whether users keep following the old way. Undoing the edit makes it live again. Waits, other expectations, typed values, rows and `nth` do not change the flow. A journey's sequence id and flow read click text by the config text rule used to match production, so a click on a data value is the same flow as a click with no text.

A journey file accepts `deprecated: true` at its top level, for a flow being retired from the app. Refresh keeps counting it.

The list of journeys with no production backing reads the last 3 calendar months.
