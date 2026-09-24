---
'@lowdefy/server-dev': minor
---

feat(server-dev): Add `lowdefy_run_journey` and `POST /lowdefy-docs/journey` — drive a page of the running dev server headless through declarative steps (`click`, `fill`, `select`, `press`, `wait`, `screenshot`, `expect: { state | visible | text | url }`, blocks addressed by `blockId`) and assert what happens, so an agent can verify behaviour and not just layout. A failing step stops the journey and returns `passed: false` with `failure: { index, step, expected, actual, message }`, the remaining steps `skipped`, any screenshots taken (MCP image content) and the final page `state`. The headless page URL now also accepts `urlQuery`.
