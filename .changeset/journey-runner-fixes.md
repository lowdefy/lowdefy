---
'@lowdefy/server-dev': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

fix(server-dev): Journeys no longer pass for the wrong reason

- **The journey's own user wins over `auth.dev.mockUser`.** A journey (or any dev tool call) that names a `user` now acts as that user even while a dev mock user is active; a journey with no `user` still acts as the mock user, as screenshots do. A journey with `user: none` is refused while a mock user is active, since every request would act as the mock user.
- **Misspelt references fail their step.** Before a step runs, every blockId, request, endpoint and `goto` page it names is checked against the app's build, and on a data set journey every `as` name against the data set's users. `expect: { hidden: nosuchblock }`, `expect: { calls: { request: nosuchrequest, count: 0 } }`, `wait: { request: nosuchrequest }` and `goto: nosuchpage` now fail naming the unknown id instead of passing.
- **`wait: { request }` needs a fresh call.** It waits for a call started since the last interaction (or since the page opened, before the first), so the call a page made on load no longer satisfies a wait after a click that never called the request.
- **Late-rendered blocks are clicked through their control.** `click`, `open` and `select` wait for their block to show before deciding what to click, so a block that renders a moment after the step starts is no longer clicked beside its button.
- **Refusals are refusals.** A journey with a `from: shape` placeholder, or one that reads email on a dev server with no mail sink, is answered 400 by `POST /lowdefy-docs/journey`, so `lowdefy test` reports it once instead of retrying a server error.
- `lowdefy_run_journey` passes `pathParams` to every run of a user list and honours the app's `basePath` in call counts and app errors. A data set journey loads its data before starting the browser.
- The config tests docs use `lowdefy@7` in every command, list the `open` step, and no longer describe running journeys in CI.
