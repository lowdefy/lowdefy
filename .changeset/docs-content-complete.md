---
'@lowdefy/docs-content': patch
'@lowdefy/server-dev': patch
'@lowdefy/docs': patch
---

fix(docs-content): the agent docs pack now contains the whole framework

The extractor renders `_nunjucks`-wrapped pages instead of skipping them, so 30 pages that never reached `@lowdefy/docs-content` (collections, archetypes, migrations, expression syntax, config tests, fixtures, snapshots, the Lowdefy API overview, agents, websockets and the auth reference) are readable through `/lowdefy-docs` and MCP, and pages that were silently truncated are complete (`concepts/connections-and-requests` grew from 962 bytes to 13.8 KB). A docs page that would extract to nothing fails the build, and prose that cannot resolve at build is named in a warning. Fetching a doc by slug returns that page's hazards, routine controls resolve under their own `control` kind instead of inheriting block hazards, and the dev server warns once when `@lowdefy/docs-content` is missing rather than serving no hazards in silence. Hazards declare whether they are a bug or documented semantics, and every bug hazard names the task that retires it.
