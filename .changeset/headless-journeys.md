---
'@lowdefy/journey-headless': minor
'@lowdefy/test-utils': minor
'@lowdefy/node-utils': minor
'@lowdefy/client-core': minor
'@lowdefy/server-dev': minor
'lowdefy': minor
---

Headless journeys: `lowdefy test --headless --build` runs the journeys that need no browser in Node, on the app's production build, for CI.

- A journey's steps decide whether it needs a browser: blocks targeted by `blockId` and checks on state, visibility, calls, errors, URLs, status codes and the database run headless; `text`, `title` and `effect` checks, screenshots, emails and page-text targets need a browser. A headless run lists every other journey as `BROWSER-ONLY`, with the step that needs a browser, and neither passes nor fails it.
- The page's own event chains run on the client engine, with the build's client plugins and no rendering, and its requests and endpoint calls run in the same process on the journey's data set and user, with the payloads the page's config builds. A missing or stale build is refused.
- Journeys gain `call` and `request` steps that call an endpoint or a page request directly, as the journey's user or another data set user, `expect: { status }`, `expect: { db }` (what the data set's database holds), and `payload` and `response` on `expect: { calls }`. A journey of only calls needs no `pageId`, so negative endpoint tests are journeys too.
- New package `@lowdefy/journey-headless`: the headless runner and its production build host.
- Lint rule L8 names journeys that need a browser only because a target reads the page on a block it already names by `blockId`.
- `lowdefy journeys variants` writes a page-less `role` variant that requests the page's requests as a refused user and expects `403`.
- The phone shell's step runner moves to `@lowdefy/client-core`. A step no longer waits on its event, only on the capped settle, so a long debounce does not hold it, and `select` on a checkbox group ticks the option.
- `lowdefy agent-setup` rules: logic and permissions are checked with headless journeys, and negative cases with page-less journeys.
