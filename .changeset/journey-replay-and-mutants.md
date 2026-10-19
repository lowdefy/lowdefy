---
'lowdefy': minor
'@lowdefy/server-dev': minor
'@lowdefy/api': patch
---

feat: Replay journeys with `--repeat`, measure what each journey exercised, and run config mutants through journeys

- **`lowdefy test [paths...] --repeat <n>`.** Run journey files or directories anywhere under the config directory, candidates in `tests/journeys/_candidates/` included; `--filter` still applies on top. `--repeat` (1 to 10) runs each journey n times and classifies it `PASS`, `FLAKY` (some runs failed, each failing run's step printed) or `FAIL` (every run failed: a finding, not a test to fix by retrying). Any `FLAKY` or `FAIL` exits 1. A journey file the runner refuses fails once and is not repeated. Run once, the output is unchanged. `lowdefy_run_tests` takes `paths` and `repeat` with the same meaning, and each result carries `class`.
- **What a journey exercised.** Every journey result carries `exercised`: the pages, requests (with call counts), endpoints and app events its browsers asked the dev server for, merged across actors, plus the endpoints a routine reached through `CallApi` (`via`) and whether each request and endpoint writes. `lowdefy test` keeps each journey's newest path in `.lowdefy/test/exercised.json`.
- **Config mutants (dev server).** `POST /lowdefy-docs/mutants` lists the mutants on what a set of journeys exercised (dropped actions, skipped validation, flipped visibility, swapped `_if` branches, dropped payload keys, retargeted links, dropped blocks and routine steps), each with an id that is stable across builds and the source line it changes. A journey POST can carry one `mutant`: the dev server applies it only to the requests of that journey's own browsers, including detached endpoint calls, and reports how often it applied. Your own browser tabs keep seeing the unmutated app.
