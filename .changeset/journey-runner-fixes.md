---
'@lowdefy/server-dev': patch
---

fix(server-dev): A dev tool call that names a `user` acts as that user while a mock user is active

`lowdefy_screenshot_page`, `lowdefy_inspect_state`, `lowdefy_eval_operator` and `lowdefy_load_state` acted as `auth.dev.mockUser` (or `--mock-user`) whenever one was set, ignoring the `user` passed to the call. An explicit `user` now wins; a call with no `user` still acts as the mock user.
