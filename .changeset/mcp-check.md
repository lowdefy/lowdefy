---
'@lowdefy/build': minor
'@lowdefy/server-dev': minor
'lowdefy': patch
'@lowdefy/docs': patch
---

New dev MCP tool `lowdefy_check`: validates the whole app the way `lowdefy build` would, without building it — every page, including ones not yet opened in dev, and the checks `lowdefy dev` only warns about but a production build rejects (they come back as errors with `prodError: true`). Returns `ok` plus located errors and warnings. It runs in a separate process so it never disturbs the running dev server, and it writes nothing. Agents call it before saying a change is done, so "works in dev, fails the deploy" is caught in the session.

`@lowdefy/build` gains the `validateOnly` build option (every validation runs, nothing is written) and a `check()` entry on `@lowdefy/build/dev`. It adds no new build rules: `lowdefy_check` reports exactly what `lowdefy build` already rejects.
