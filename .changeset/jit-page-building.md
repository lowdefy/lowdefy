---
'@lowdefy/build': minor
'@lowdefy/server-dev': minor
'@lowdefy/operators-js': patch
'@lowdefy/server': patch
---

feat: JIT page building for dev server

**Shallow Refs and JIT Build (`@lowdefy/build`)**

- Shallow `_ref` resolution stops at configured JSON paths, leaving `~shallow` markers for on-demand resolution
- `shallowBuild` produces a page registry with dependency tracking instead of fully built pages
- `buildPageJit` fully resolves a single page on demand using the shallow build output
- File dependency map tracks which config files affect which pages for targeted rebuilds
- Build package reorganized: `jit/` folder for dev-server-only files, `full/` folder for production-only files

**JIT Page Building (`@lowdefy/server-dev`)**

- Pages are built on-demand when requested instead of all at once during initial build
- Page cache with file-watcher invalidation for fast rebuilds
- `/api/page/[pageId]` endpoint triggers JIT build if page not cached
- `/api/js/[env]` endpoint serves operator JS maps
- Build error page component displays errors inline in the browser
- Port-in-use check with clear error message before starting server

**Operator JS Hash Check (`@lowdefy/operators-js`)**

- Added hash validation for jsMap to detect stale operator definitions
