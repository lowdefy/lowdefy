---
'@lowdefy/server-dev': minor
'lowdefy': minor
---

feat(server-dev): Add `lowdefy_run_journey` and `POST /lowdefy-docs/journey` — drive a page of the running dev server headless through declarative steps (`click`, `fill`, `select`, `press`, `wait`, `screenshot`, `expect: { state | visible | text | url }`, blocks addressed by `blockId`) and assert what happens, so an agent can verify behaviour and not just layout. `expect: { text }` and `expect: { state }` wait up to the step timeout for the text or value to match, as `url` and `title` do, and `state` with `equals: null` also passes when the path does not exist. After an interaction the runner lets the page settle for at most 5 seconds, whatever the step timeout. A failing step stops the journey and returns `passed: false` with `failure: { index, step, expected, actual, message }`, the remaining steps `skipped`, any screenshots taken (MCP image content) and the final page `state`. `lowdefy_run_journey` returns a count of what the run exercised; pass `exercised: true` for the full block, or `exercised: false` to leave it out. The headless page URL also accepts `urlQuery`.
