---
'@lowdefy/server-dev': minor
'@lowdefy/build': minor
---

feat: Single-process dev server with in-memory build state (dev-server-v2 phases 1–3).

- The dev manager's two-process orchestration is replaced by a `lowdefy()`
  Vite plugin (initial build in the config hook, watchers in
  configureServer) plus a ~30-line supervisor that respawns on exit code 87.
  Crashes now respawn with backoff instead of leaving a dead server.
- Build state lives in memory and is shared with the Hono app in-process:
  the `build/reload` and `invalidatePages` signal files are gone, SSE reload
  is an event emitter, page invalidation is a method call, and the JIT
  builder uses the live build context — warm page builds drop from
  100–500ms to single-digit milliseconds.
- Additive plugin installs no longer restart the process; version changes,
  removals, `.env` and auth changes still get a fresh process.
- JIT page builds use deterministic namespaced keys (`p:<pageId>:<n>`):
  rebuilding a page from identical config produces byte-identical
  artifacts, and the shared keyMap stays bounded. The `idCounter.json`
  artifact and per-build keyMap/refMap writes are gone.
- JIT page builds are serialized through a queue — the shared build context
  is single-threaded by design.
