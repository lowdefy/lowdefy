---
'lowdefy': patch
---

fix(cli): Journey hardening and evidence counts no longer give wrong answers

`lowdefy journeys harden`:

- Hardens only journeys with a data set (`data:`). A journey without one is left out with an error naming it, because its mutant runs would write to your own database from parallel workers. With none left, harden exits 1.
- Counts a failed step as a kill only when the mutant reached the run. A failure where the mutant was never applied is an error and runs once more.
- Merges `.lowdefy/test/mutation.json` per journey. A run over some journeys keeps the scores of every other journey that still exists.
- A measured path in `.lowdefy/test/exercised.json` now changes only with what the journey runs (its page, steps, user, data set, path params and query). Refreshing `evidence:`, renaming the journey or changing its tags no longer marks every journey as unmeasured.

`lowdefy journeys evidence --refresh`:

- Keeps a renamed label's history. Clicks resolve to any click text a committed flow already holds, so the old flow is not recounted to 0.
- Replaces a committed month only when the cache holds more final days of it. Two machines holding the same days no longer overwrite each other.
- No longer writes `evidence.dev`. The dev recordings count is printed but not written, and a refresh removes an existing `dev` key.

`journeys evidence`, `journeys coverage` and `journeys usage` refuse a production cache whose days were pulled with different filters (project, `--environment`, `--include-test-accounts`). The error names each set of filters with its days and gives the `--refetch` pull that makes them one set. `journeys pull posthog` warns about cached days pulled with other filters.
