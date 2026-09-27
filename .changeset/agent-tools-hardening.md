---
'lowdefy': patch
'@lowdefy/node-utils': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

fix: More robust dev tooling for coding agents, and `<basePath>/` serves the app

- `lowdefy mcp` uses only a Lowdefy hub socket owned by the current user. The hub creates its socket readable and writable by its user only, from the moment it exists.
- The hub's open-tabs check, `lowdefy_dev_status` and `lowdefy mcp`'s connection to a dev server give up on a dev server that stops answering, instead of hanging. The hub's cleanup passes no longer pile up. A dev tool call that timed out, such as a long journey, is no longer run a second time.
- `lowdefy_dev_logs` and `lowdefy hub logs` read only the end of the log, return at most 1000 lines, and refuse a `lines` value that is not a positive integer.
- `.lowdefy/instance.json` records the dev server's process start time. A record left behind by a killed dev server no longer blocks `lowdefy dev`, and is no longer used by `lowdefy mcp`, when its process id has been reused.
- With `config.basePath` set, `<basePath>/` (with a trailing slash) now serves the app root in `lowdefy dev` and in production. It answered 404 before.
- The screenshot tool's viewport `width` and `height` are at most 4096.
