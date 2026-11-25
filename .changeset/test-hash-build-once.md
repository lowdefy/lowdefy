---
'lowdefy': patch
---

`lowdefy test` and `lowdefy_run_tests` hash the dev server's build much faster. The hash reads only the artifacts it covers (no longer `keyMap.json` or `refMap.json`), keeps each artifact's hash in `.lowdefy/test/build-hashes.json` by path, size and modified time, and rereads only what the build wrote since. `lowdefy test` also hashes the end of a run once instead of twice. The build hash changes value once with this release, so `headless-run.json` records from an earlier version run again once.
