---
'lowdefy': major
'@lowdefy/server': major
'@lowdefy/server-dev': major
'@lowdefy/server-e2e': major
'@lowdefy/docs-content': patch
---

chore!: Node.js 24 is now the minimum supported version.

**Breaking:** Lowdefy no longer supports Node.js 22. Upgrade to Node.js 24 or newer before
upgrading Lowdefy.

- The CLI and the servers declare `"node": ">=24"` in `engines`, and the CLI refuses to start on
  a Node.js version below 24.
- `lowdefy init-docker` generates a Dockerfile on `node:24-slim`. Apps with a Dockerfile generated
  by an earlier version should change their `FROM node:22-slim` lines to `node:24-slim`.
- The Vercel build output declares the `nodejs24.x` function runtime.
