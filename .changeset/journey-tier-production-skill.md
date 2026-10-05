---
'lowdefy': minor
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

feat(cli): Production skill reports old flows and tier moves; coverage leaves deprecated journeys out

- `lowdefy journeys coverage` leaves journeys with `deprecated: true` out of every measure. They never run, so a flow only a deprecated journey walks now reads as uncovered, and removing the flag covers it again.
- The `journeys-from-production` skill that `lowdefy agent-setup` writes runs `lowdefy journeys usage --json` before and after `lowdefy journeys evidence --refresh`. It reports the deprecated flows users still follow, with their rate and the journey that replaced them, the journeys whose tier changed, and the journeys still unranked. It never deletes a journey or a deprecated flow. It may suggest you delete a deprecated flow that shows no use.
- A journey's sequence id and flow lines read click text by the config text rule, the same rule used to match production. A click on a data value is the same flow as a click with no text. Tiers use the same rule to decide which journeys are unranked, and read the app's config text only when a journey's steps no longer match its stored id.
- `lowdefy journeys evidence --refresh` resolves clicked-text tokens to config text and removes day files pulled before tokens. It reads only days pulled under this machine's trace salt.
