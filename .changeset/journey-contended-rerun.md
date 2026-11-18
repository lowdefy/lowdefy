---
'lowdefy': minor
---

feat(cli): A journey that fails beside others is rerun alone before it is reported

A browser journey that fails while another journey is in flight is run again alone before `lowdefy test` or `lowdefy_run_tests` reports it. Passing alone, it is reported as a PASS that names its first failure, the closing line counts it (`48 passed (3 after an alone rerun)`), and the run takes one fewer journey at a time. Failing alone, it is reported with the alone run's failure. `.lowdefy/test/results.json` keeps `contended` and `contendedFailure`, and the `lowdefy_run_tests` answer counts these journeys as `contended`.
