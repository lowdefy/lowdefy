---
'@lowdefy/server-dev': minor
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

feat(server-dev): Every dev tool that acts as someone takes the same `user` option

`lowdefy_screenshot_page`, `lowdefy_inspect_state`, `lowdefy_eval_operator`, `lowdefy_load_state`, `lowdefy_run_request` and `lowdefy_run_endpoint` now take `user` in the forms `lowdefy_run_journey` already took: a user object, `"none"` to act signed out, or the name of a user in a journey data set together with `data`. With a data set the call acts as that user and runs on a fresh database of its own loaded with the data set, as a journey with `data` does, so an agent can check a page, a request or an endpoint as a real user without hand-made cookies or scripts. `lowdefy_run_endpoint` keeps `system: true` as its only other form. Every tool description carries the same sentence explaining the option, and the `/lowdefy-docs` routes take the same `user` and `data` params.
