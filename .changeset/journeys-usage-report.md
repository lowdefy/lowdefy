---
'lowdefy': minor
---

feat(cli): Add `lowdefy journeys usage`, a report of journeys ranked by recent production use

`lowdefy journeys usage [paths...] [--tag] [--filter] [--tier] [--usage-window] [--json]` ranks the journeys in `tests/journeys/` by their recent rate: production sessions over the final days their months hold in the usage window, the last 3 calendar months (`--usage-window 3m`) ending at the newest month any selected journey holds. Each journey shows its popularity tier, its sessions and failures over the window and all time, a line per month with that month's persons and organisations, and its deprecated flows with their recent use. Below that it lists the production flows no journey covers, from `.lowdefy/test/coverage.json`, ranked by their sessions in coverage's window and not tiered.

Tiers are cumulative cuts of the selection ranked by rate: `common` reaches 50% of the summed rates, `wide` 80%, `edge` 95%, and `full` is every journey. They nest, never split equal rates, and are cut over the paths, tags and filters selected. A journey edited since the last evidence refresh, or never refreshed, is unranked and in every tier; a `deprecated: true` journey is in no tier. With fewer than 100 journey matches in the window, every tier but `full` is refused. `--json` prints the same rows for agents.
