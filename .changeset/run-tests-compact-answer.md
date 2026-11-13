---
'lowdefy': patch
---

fix(cli): lowdefy_run_tests answers with a summary an agent can always read

The `lowdefy_run_tests` agent tool answered with every journey's measured path (the pages, requests, events and blocks it touched), up to thousands of entries a journey. A suite of 40 journeys gave an answer of about 500 KB, which agents' clients refuse, so the agent waited for the whole run and then saw nothing. On one machine over a month, 37 of 104 runs ended that way.

The tool now answers with `summary`, `failed` (each failing or flaky journey with its report and failing step), `passed` and `skipped` (one line per journey) and `resultFile`. The answer stays under 25,000 characters for any suite: when not everything fits, failures are named before passing lines, and `omitted` counts what was left out. Every journey of the run is written to `.lowdefy/test/results.json`, which `resultFile` names. The measured path is no longer in the answer; `.lowdefy/test/exercised.json` holds it as before.

An answer that used `results` should read `failed` and `passed`, or the result file.

The tool also sends an MCP progress notification as each journey finishes when the client passes a progress token, so a long run is not silent. `lowdefy test` in a terminal is unchanged.
