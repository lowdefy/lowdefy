---
'@lowdefy/server-dev': patch
'@lowdefy/build': patch
'@lowdefy/errors': patch
'@lowdefy/api': patch
'@lowdefy/cli': patch
---

fix(server-dev): Cheaper rebuilds and restarts in the dev server

- **Restarts no longer fail with "Port in use".** A restart now waits for the old server process to exit before it starts the new one (up to 10 s, then a forced stop and up to 5 s more), so the new process never finds the port still taken and the server no longer stays down until the next restart.
- **No more endless rebuild loop.** An app whose own local plugin package is its config directory (its plugin lives next to `lowdefy.yaml`) rebuilt itself every few seconds when its ref resolvers wrote into `public/`. The local plugin watcher now reacts only to code files (`.js`, `.mjs`, `.cjs`, `.jsx`, `.ts`, `.tsx`, `.json`) and ignores `public/`, `node_modules` and the build directories. YAML and Markdown edits stay with the config watcher, so a page edit no longer runs a full build as well.
- **Page builds no longer rewrite the whole key maps.** Every page the dev server built rewrote `keyMap.json` and `refMap.json` twice, and the files only grew (tens of MB on large apps, with a full parse after each edit). They now hold only what the config build wrote; each page build writes the keys it added to a small file under `build/jitMaps/`. Error locations, `/lowdefy-docs/find` and the file watcher read those files. A key from a page built before the last two page edits may resolve without a location.
- **Unchanged build files are left alone.** After a config build, artifacts whose bytes did not change are no longer replaced, so Vite does not reload modules that did not change.
- **Agents restart less.** The MCP tools and agent guidance now say to restart the dev server only when it seems stuck or build status looks stale, or after secrets a wrapper injects have changed. `.env` edits and local plugin code are picked up without a restart.
