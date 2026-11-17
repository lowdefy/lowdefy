---
'lowdefy': patch
'@lowdefy/node-utils': patch
---

fix(cli): A `lowdefy test --headless --build` run can set test values for secrets

A journey on the production build read `test-secret-<NAME>` for every secret, with no way to set one, so it could not exercise logic that compares a secret with data. A `LOWDEFY_SECRET_<NAME>` set in the environment of the command now replaces the stand-in for every journey of the run:

```
LOWDEFY_SECRET_ORG_ID=org-a lowdefy test --headless --build
```

A secret that is not set keeps `test-secret-<NAME>`, and the values in the app's `.env` file are still left out, so a run never needs the app's real secrets and gives the same answer in CI. `loadDotEnvFile` in `@lowdefy/node-utils` now returns the names of the variables it set.
