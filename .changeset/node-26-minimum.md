---
'lowdefy': major
'@lowdefy/server': major
'@lowdefy/server-dev': major
'@lowdefy/server-e2e': major
'@lowdefy/docs-content': patch
---

chore!: Node.js 26 is now the minimum supported version.

**Breaking:** Lowdefy no longer supports Node.js 24. Upgrade to Node.js 26 or newer before
upgrading Lowdefy.

- The CLI and the servers declare `"node": ">=26"` in `engines`, and the CLI refuses to start on
  a Node.js version below 26.
- `lowdefy init-docker` generates a Dockerfile on `node:26-slim`. Apps with a Dockerfile generated
  by an earlier version should change their `FROM node:24-slim` lines to `node:26-slim`.
- The Vercel build output declares the `nodejs26.x` function runtime. Set the Vercel project's
  Node.js version to 26.x so the install and build steps run on it too.
