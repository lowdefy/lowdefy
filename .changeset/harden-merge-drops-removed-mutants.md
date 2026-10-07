---
'lowdefy': patch
'@lowdefy/server-dev': patch
---

`lowdefy journeys harden` no longer keeps a removed mutant in the merged mutation report. When a run measures only some journeys, it asks the dev server which earlier mutants still exist and drops the rest, then recounts each journey's `killed` and `total` and the suite score without them. An earlier mutant on a page that fails to build is kept as it was, and harden names that page in one warning line instead of failing the run. The dev server's mutant listing now returns `ids` (every copy's id), and lists nothing for a page that is no longer in the app.
