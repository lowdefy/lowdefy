---
'@lowdefy/server-dev': patch
'@lowdefy/test-utils': patch
'lowdefy': patch
---

fix(server-dev, cli): A headless journey on the dev server reads test secrets, as on a build

A headless journey on the dev server read the `LOWDEFY_SECRET_*` the server held, while `lowdefy test --headless --build` reads stand-ins, so the same journey could pass on the build and fail locally: a webhook signed with a stand-in answered 401, and a real secret equal to a data-set id redacted sunk records.

- A headless journey on the dev server now reads `test-secret-<NAME>` for every secret the dev build names, with `LOWDEFY_TEST_SECRET_<NAME>` over them, as on a build. The dev server's own routes and browser journeys keep the app's secrets, such as the auth secret.
- `lowdefy test` sends its `LOWDEFY_TEST_SECRET_*` with each headless journey, so they apply on a dev server it started and on one already running. `POST /lowdefy-docs/journey` takes them as `secrets`, for a headless journey only.
- This holds for a headless journey with no data set too: a connection that needs a real secret, such as the app's database URI, reads the stand-in and fails, as it does on a build. Give the journey a data set.
- A `CallApi` with `detached: true` is recorded and its endpoint never runs, as on a build. The dev server used to send it, so its target ran on the app's secrets and added writes and outside calls (an enrichment worker's lookups) that a build run never makes. A browser journey's detached calls are still sent.
- The headless scrub also redacts the `CRON_SECRET` and `BETTER_AUTH_SECRET` the dev server holds.
- `@lowdefy/test-utils/secrets` exports `createTestSecrets` and `readBuildSecretNames`, which takes an optional `cache` for a build that changes while it is read.
