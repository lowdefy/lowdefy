---
'@lowdefy/server-dev': patch
'@lowdefy/test-utils': patch
'lowdefy': patch
---

fix(server-dev, cli): A headless journey on the dev server reads test secrets, never the app's real ones

A headless journey on the dev server read the `LOWDEFY_SECRET_*` the server held, while `lowdefy test --headless --build` reads stand-ins, so the same journey could pass on the build and fail locally: a webhook signed with a stand-in answered 401, and a real secret equal to a data-set id redacted sunk records.

- A headless journey on the dev server now reads `test-secret-<NAME>` for every secret the dev build names, with `LOWDEFY_TEST_SECRET_<NAME>` over them, as on a build. The dev server's own routes and browser journeys keep the app's secrets, such as the auth secret.
- `lowdefy test` sends its `LOWDEFY_TEST_SECRET_*` with each headless journey, so they apply on a dev server it started and on one already running. `POST /lowdefy-docs/journey` takes them as `secrets`, for a headless journey only.
- This holds for a headless journey with no data set too: a connection that needs a real secret, such as the app's database URI, reads the stand-in and fails, as it does on a build. Give the journey a data set, or run it in the browser.
- `@lowdefy/test-utils/secrets` exports `createTestSecrets` and `readBuildSecretNames`, which takes an optional `cache` for a build that changes while it is read.
