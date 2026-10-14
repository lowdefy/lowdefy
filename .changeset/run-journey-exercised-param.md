---
'@lowdefy/server-dev': minor
'lowdefy': minor
---

feat(server-dev): `lowdefy_run_journey` returns a count of what the run exercised, and takes `exercised` for more

The tool always returned the full `exercised` block: every request, endpoint, event and rendered block, hundreds of lines for a three-step journey and that many again for each user of a user list. It now returns a count of each list by default. Pass `exercised: true` for the full block, or `exercised: false` to leave it out. `lowdefy test`, the REST route and the journey lints are unchanged: they always read the full block.
