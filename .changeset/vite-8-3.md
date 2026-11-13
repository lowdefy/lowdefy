---
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

fix(deps): Update vite to 8.3.8 and @vitejs/plugin-react to 6.3.0

Brings Vite's bug fixes since 8.1.6 (Rolldown 1.2, dev server HTML attribute escaping, watcher error handling, CSS and preload fixes) and plugin-react's HMR fix for components that export several components from one file.
