---
'lowdefy': patch
'@lowdefy/server-dev': patch
---

fix(cli): Fix port availability check for start command

The CLI's `checkPortAvailable` was called with `undefined` port when no `--port` flag was passed, causing `net.listen(undefined)` to bind a random port instead of checking port 3000. Added default `port: 3000` in `getOptions`. Removed redundant `checkPortAvailable` from server-dev manager since the CLI now catches port conflicts before the server starts.
