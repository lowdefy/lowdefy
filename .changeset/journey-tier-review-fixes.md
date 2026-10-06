---
'lowdefy': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

fix(cli): Plain test runs skip the tier config build; tier refusals name the option used

- `lowdefy test` without `--tier`, and `lowdefy_run_tests` without `tier`, never build config to rank journeys. A journey whose steps click a data value shows `unranked` on its `PASS` line in such a run; `--tier common`, `wide` or `edge` ranks it. A config that does not build no longer fails a plain test run at tier selection.
- With fewer than 100 journey matches in the usage window, the `PASS` line shows the rate and failures with no tier or rank.
- The refusal of a tier below 100 matches says `--tier full` on the command line and `tier "full"` over MCP.
