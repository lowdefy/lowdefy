---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/client': minor
'@lowdefy/compile': minor
'@lowdefy/engine': minor
'@lowdefy/operators': minor
'@lowdefy/server': minor
---

feat: Config compiler S3 — compiled builds evaluate operators as closures and code-split pages.

Compiled builds (`options.compiler` / `LOWDEFY_BUILD_COMPILER=true`) now
emit executable ES modules alongside every JSON config artifact, retiring
the parser tree-walks where they land:

- Server configs (request and connection properties, agents, and whole
  endpoints with closures at exactly the routine keys the runner
  evaluates) ship as closure modules; the api imports them when present
  and `evaluateOperators` dispatches function inputs through
  `evaluateClosures` — gated bit-for-bit against ServerParser.
- Public pages ship as internal-form page modules with client operator
  positions compiled to closures at the engine's exact parse roots
  (block keys, whole event actions, request payloads), consumed through
  a one-adapter dispatch inside `WebParser.parse` — protected pages
  never enter the public registry.
- A generated `pageRegistry.mjs` of static import thunks lets the client
  bundler code-split one chunk per public page, and per-page types
  modules import exactly the blocks, actions, client operators, and
  icons each page renders (lazy full-set fallback for protected pages).
  Measured on the reference docs app: main bundle 5,693 kB → 976 kB
  (−83%).

The walker remains the default; walker builds are byte-identical and
untouched.
