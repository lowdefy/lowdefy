---
'@lowdefy/shell': minor
'@lowdefy/server-dev': minor
---

feat(shell): Lowdefy Dev connects to `lowdefy dev`, has a shake menu, and joins the dev tab channel so agents can drive it

- `LOWDEFY_SHELL_VARIANT=dev | release` decides whether a shell carries the developer features. Lowdefy Dev builds as `dev`, every other shell as `release`, whose bundle leaves them out. `pnpm --filter=@lowdefy/shell check:release-bundle` fails a release bundle that holds the dev-tab client.
- Lowdefy Dev connects to a dev server from a `lowdefy-dev://connect` link, a scanned QR code, a typed address or one of the last 5 servers. It asks "Connect to `<host>`?" before attaching to a server off the device; a simulator's localhost connects at once. A paired server's token goes with every request and websocket.
- Shake the phone (or open `lowdefy-dev://menu`) for reload, switch server, clear data, logs, the block gallery and the shell version.
- The open app joins the dev server's tab channel as a browser tab does: it reloads with empty page state when the dev server rebuilds, answers state inspection and operator evaluation in a browser tab's shape, and runs journey steps (`click`, `fill`, `select`, `press`, `wait`, `screenshot`) by block id, waiting for each action chain to finish.
- The dev server lets a phone paired with `lowdefy dev --lan` answer on `/api/dev-inspect` and post to `/api/dev-recording`; its other dev tools stay on this computer. A tab that cannot read an event stream can poll `/api/reload?transport=poll`.
