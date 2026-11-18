---
'@lowdefy/api': patch
'@lowdefy/node-utils': patch
'@lowdefy/server-dev': patch
---

fix(server-dev): A fault the routine's own `:catch` handled no longer fails a browser journey

A browser journey failed at a step whose endpoint answered with its normal reply, when a routine step threw a config, operator or internal error inside a `:try` and the routine's `:catch` handled it. The same journey passed headless, so one journey file gave two verdicts.

- The dev server's error sink now stamps its error store entry `caught: true` when a `:catch` of the routine handled the fault, and the journey invariants both runners share leave a caught entry out. A journey is judged by the routine's answer in the browser and headless alike.
- A fault counts as caught only when the `:catch` finishes without passing it on. A `:catch` that rethrows it with `:throw: { _error: true }`, or fails with an error of its own, leaves it not caught, so the journey still fails at its step. An enclosing `:try` with a `:catch` can still catch a rethrown fault.
- A caught fault is still logged in the terminal and sent to error tracking, so a caught typo is still seen. Outside a journey run, the dev server's build status lists it, marked `caught`. A caught fault a journey run caused stays with that run: it shows in the terminal log, but not in build status or the journey's result.
