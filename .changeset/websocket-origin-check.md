---
'@lowdefy/api': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

Websocket upgrades from another origin are refused. `/api/websocket` accepts an upgrade whose `Origin` matches the `Host` it arrived on, the first `X-Forwarded-Host`, or the app's configured public URL (`BETTER_AUTH_URL`, the current environment's `url`, or an auth trusted origin), and one that sends no `Origin` (a server or script). Any other upgrade gets a 403, and the server logs a warning with its `Origin` and `Host`. Behind a proxy or CDN, pass the original `Host` or set `X-Forwarded-Host`. Hosts compare without case and without default ports. In `lowdefy dev`, the upgrade's `Host` must also be `localhost`, a `*.localhost` name or an IP address, as for every other dev request. The rule lives in `@lowdefy/api` (`isSameOriginRequest`, `isWebSocketOriginAllowed`), shared by every server.
