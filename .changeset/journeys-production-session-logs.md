---
'lowdefy': minor
---

feat(cli): Production sessions read as session logs, and coverage groups flows only at scale

`lowdefy journeys session --source production` lists the sessions of the pulled production window (`--since`, `--from`, `--to`, at most 30 days) and prints any one of them as a log, the same way dev sessions print: the controls used and what the app did, without typed values, and with clicked text only when it is text from the app's config.

`lowdefy journeys coverage` now groups sessions into flows and ranks them by use only when the window holds 100,000 production rows or more, where nobody can read sessions one by one. Below that the flow measure is not computed, the summary says why and points to the session logs, and `.lowdefy/test/coverage.json` records whether flows were grouped. `--group` and `--no-group` force either way. `lowdefy journeys usage` lists uncovered flows only from a report that grouped them, and otherwise says why.
