---
'lowdefy': minor
'@lowdefy/docs-content': patch
---

feat(cli): `lowdefy journeys explore` prunes candidate folders older than 14 days

Each explore run writes its candidates to `tests/journeys/_candidates/explorer/<run>/`, and nothing removed old runs. A run now records a hash of each candidate it keeps in `.generated.json` in that folder, and at its start removes run folders older than 14 days, the age `.lowdefy/explore/<run>/` is kept for. A folder with a file edited or added since its run wrote it is kept, so a candidate a person changed is never deleted. The summary reports the folders pruned and those kept for edits, and `report.json` gains `pruned: { pruned, keptEdited }`.
