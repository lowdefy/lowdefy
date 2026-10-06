---
'lowdefy': minor
'@lowdefy/docs': minor
'@lowdefy/docs-content': minor
---

feat(cli): Run journeys by popularity tier with `lowdefy test --tier`

`lowdefy test --tier <common|wide|edge|full>` runs only the most-used journeys of a selection, ranked by their recent production use, so you can check the happy paths first (`common`) and widen to the edge cases real users still reach (`edge`) before calling a change done. Tiers are cut after paths, `--tag` and `--filter` narrow the suite, over that selection alone, and `--usage-window <n>m` (default `3m`) sets the calendar months the ranking reads. A journey with a list of users is tiered once and runs as each user. Journeys with no counts for their current steps run in every tier. A tiered run never records as the suite's run, and a selection with fewer than 100 journey matches in the window, or no evidence, is refused. `lowdefy_run_tests` takes the same `tier` and `usageWindow`.

The `PASS` line now shows a journey's tier, rank, rate and failures over the usage window: `PASS  member assigns an open ticket  (5 steps, 2100ms)  common #2 · 13.7/day · 14 failed (3m) · 11/12 mutants`, or `unranked` for a journey with no counts for its current steps.

A journey with `deprecated: true` is skipped in every run, even when named by path or `--filter`, and listed as `SKIP deprecated` with its recent rate. A plain run that skips one still records as the full suite.

`lowdefy journeys usage` now selects journeys with the same function as `lowdefy test`, so a persona filter such as `--filter "[admin]"` picks the same journeys in both. The AGENTS.md section and `lowdefy-config` skill that `lowdefy agent-setup` writes tell agents to run `tier: common` first and widen to `tier: edge` before calling a change done.
