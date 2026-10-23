---
'@lowdefy/server-dev': patch
---

perf(server-dev): Vite watches only the build files the source imports, and the editor hover resolves once per frame.

Vite no longer crawls the page, request, api and map files under `build/` that no module imports; it watches the build files the client and server code import, found from their imports, plus the CSS in `build/`. The Option/Alt hover in the editor-link overlay now calls `elementFromPoint` and `getBoundingClientRect` at most once per animation frame instead of on every pointer move.
