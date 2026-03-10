---
'@lowdefy/cli': patch
---

fix(cli): Remove install skip for local builds

Removed the early return in `installServer.js` when `lowdefyVersion === 'local'`. The build pipeline adds custom plugins to server's `package.json` via `addCustomPluginsAsDeps`, then runs `pnpm install` to link them. Skipping install for local versions meant plugins were never linked, breaking deploys (e.g. Vercel docs deploy failing with `ERR_MODULE_NOT_FOUND`).
