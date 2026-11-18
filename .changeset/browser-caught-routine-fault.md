---
'@lowdefy/node-utils': patch
'@lowdefy/server-dev': patch
---

fix(server-dev): A fault the routine's own `:catch` handled no longer fails a browser journey

A browser journey failed at a step whose endpoint answered with its normal reply, when a routine step threw a config, operator or internal error inside a `:try` and the routine's `:catch` handled it. The same journey passed headless, so one journey file gave two verdicts.

- The dev server's error sink now stamps its error store entry `caught: true` when a `:catch` of the routine handled the fault, and the journey invariants both runners share leave a caught entry out. A journey is judged by the routine's answer in the browser and headless alike.
- The fault is still logged in the terminal, listed in the dev server's build status (now with `caught`) and sent to error tracking, so a caught typo is still seen.
