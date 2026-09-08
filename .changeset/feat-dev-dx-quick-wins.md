---
'@lowdefy/node-utils': minor
'@lowdefy/build': patch
'lowdefy': patch
'@lowdefy/server-dev': patch
---

feat: Dev DX quick wins — fast warm boots, no mid-session reloads.

- `lowdefy dev` no longer resets the server `package.json` at boot, so plugin
  packages discovered by previous sessions stay installed — no more
  uninstall/reinstall churn, no install pause when navigating to pages whose
  plugins were already known, and a stable lockfile that preserves Vite's
  dependency optimizer cache across sessions.
- Installs are skipped entirely when `package.json` is unchanged (hash stored
  inside `node_modules`, so deleting `node_modules` forces a reinstall). Warm
  boots drop from ~30s to a few seconds.
- The dev server pre-discovers all client dependencies at startup
  (`optimizeDeps.entries`), eliminating mid-session "optimized dependencies
  changed" full page reloads.
- Tailwind scan inputs are excluded from Vite's watcher — first visits to a
  page no longer force a full browser reload that aborts in-flight requests
  ("Failed to fetch" error walls). CSS recompilation is driven by the
  `tailwind-candidates.css` import, now touched only when a build actually
  changes tailwind content.
- Build artifact writes skip byte-identical content, so unchanged JIT page
  builds no longer invalidate `clientJsMap.js` (Routing HMR churn) or
  `serverJsMap.js` (SSR graph reloads). New `writeFileIfChanged` and
  `installIfPackageJsonChanged` utilities in `@lowdefy/node-utils`.
- Polish: dev server shutdown log no longer says "next server"; the missing
  `./messages` plugin export notice logs once per process instead of on every
  rebuild.
