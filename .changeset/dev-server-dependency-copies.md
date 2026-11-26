---
'@lowdefy/server-dev': patch
---

fix(server-dev): Each package gets its own version of a client dependency in the dev server

When a linked plugin and a Lowdefy package depend on different versions of one package, the dev server's dependency optimiser served both whichever copy its scan met first, and the winner changed from one start to the next. A plugin pinning `react-markdown` 8 could get Lowdefy's 10 and throw. The dev server now pre-bundles each installed copy separately and serves every importer its own, as a production build bundles it. Packages in `resolve.dedupe` (React, antd, dayjs, the server's `@lowdefy` packages) stay single.
