---
'lowdefy': patch
---

fix(cli): `lowdefy journeys harden` prints progress and `--page` narrows the baseline

harden used to print nothing between starting the development server and the final report, which on a large app is twenty minutes or more, so a slow run looked like a hung one. It now prints `Baseline 37/412 journeys (2 failed)` while the baseline runs and `Mutants 12/45 run (3 survived)` while mutants run, every few journeys or about every 15 seconds. With `--page`, the baseline also skips journeys whose last measured run in `.lowdefy/test/exercised.json` touched none of those pages and whose `pageId` and `goto` steps name none, and says how many it left out. A journey with no record, a changed journey, or a record measured on another build is always run.
