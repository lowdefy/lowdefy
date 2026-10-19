---
'lowdefy': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

fix(cli): Journey tier and production review fixes

- `lowdefy test` without `--tier`, and `lowdefy_run_tests` without `tier`, never build config to rank journeys. A journey whose steps click a data value shows `unranked` on its `PASS` line in such a run; `--tier common`, `wide` or `edge` ranks it. A config that does not build no longer fails a plain test run at tier selection.
- With fewer than 100 journey matches in the usage window, the `PASS` line shows the rate and failures with no tier or rank.
- The refusal of a tier below 100 matches says `--tier full` on the command line and `tier "full"` over MCP.
- `lowdefy journeys evidence` names the final days it leaves out because they were pulled under another trace salt, or because there is no salt, with the pull that fetches them again. It no longer says the cache holds no final day when it holds days it cannot read.
- The `journeys-from-production` skill narrows a journey's click on one of several controls with the same label by `blockId`, `row` or `containing`, since a production click carries no `nth`. The production journeys docs say so too.
