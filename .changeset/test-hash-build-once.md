---
'lowdefy': patch
---

`lowdefy test` and `lowdefy_run_tests` hash the dev server's build much faster. The hash reads only the artifacts it covers (no longer `keyMap.json` or `refMap.json`), keeps each artifact's hash in `.lowdefy/test/build-hashes.json` by path, size and modified time, and rereads only what the build wrote since. `lowdefy test` also hashes the end of a run once instead of twice. The build hash changes value once with this release, so records written by an earlier version count as taken on other config, once: `headless-run.json`'s remembered browser-only journeys run headless again, and `lowdefy journeys harden --page` keeps every journey in its baseline until the next `lowdefy test` writes `exercised.json` again.
