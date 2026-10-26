---
'@lowdefy/server-dev': patch
---

perf(server-dev): Vite skips the build artifact folders no module imports, and the editor hover resolves once per frame.

Vite no longer watches `build/pages`, `build/api`, `build/connections`, `build/agents` and `build/jitMaps`, which hold thousands of files in a large app that the server reads from disk and no module imports. The Option/Alt hover in the editor-link overlay now calls `elementFromPoint` and `getBoundingClientRect` at most once per animation frame instead of on every pointer move.
