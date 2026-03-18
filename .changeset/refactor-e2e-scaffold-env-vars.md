---
'@lowdefy/e2e-utils': patch
---

refactor(e2e-utils): Update scaffold env vars and simplify init.

Renamed `MDB_E2E_URI` to `LOWDEFY_E2E_MONGODB_URI` in scaffold templates to align with the new `LOWDEFY_E2E_SECRET_*` override pattern. The init script no longer runs install automatically — dependencies are added to `package.json` and the user is prompted to install.
