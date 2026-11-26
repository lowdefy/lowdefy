---
'lowdefy': patch
---

fix(cli): A `lowdefy test --headless --build` run can set test values for secrets

A journey on the production build read `test-secret-<NAME>` for every secret, with no way to set one, so it could not exercise logic that compares a secret with data. A `LOWDEFY_TEST_SECRET_<NAME>` set in the environment of the command now replaces the stand-in for every journey of the run:

```
LOWDEFY_TEST_SECRET_ORG_ID=org-a lowdefy test --headless --build
```

A secret with no test value keeps `test-secret-<NAME>`. The app's real secrets, `LOWDEFY_SECRET_*` from the shell, CI or `.env`, never reach a test run. Sunk request records redact every secret value of 8 or more characters, so `expect.sunk` and a stub's `match` cannot match a secret value that is also a data-set id.
