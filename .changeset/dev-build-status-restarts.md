---
'@lowdefy/server-dev': patch
'@lowdefy/build': patch
'lowdefy': patch
'@lowdefy/docs': patch
---

`lowdefy_build_status({ wait: true })` (`GET /lowdefy-docs/build-status?wait=true`) now also waits for a server restart or plugin install an edit needs, such as a new connection type, a new plugin package or a `.env` change, and answers once the restarted server is ready. It used to answer before the restart, so the agent's next call failed while the server came back. After `lowdefy_restart`, the same call waits for the restart.

A config build that cannot publish its output (on Windows, a file another process holds open) now retries for a few seconds, and when it still fails the build status reports the error and the next change rebuilds, instead of reporting `ok` over a half-updated build.

Editing a local plugin now rebuilds the config for every plugin, block-only plugins included, so a new type is defined and a build a broken plugin failed clears once the plugin is fixed. The server still restarts only for plugins with server-side types. A dev config build no longer rewrites the server's `package.json` when its content is unchanged.
