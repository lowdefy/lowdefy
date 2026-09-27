---
'@lowdefy/api': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

Check the Origin of websocket upgrades. `/api/websocket` now accepts an upgrade from a page served by the app itself, or from a client that sends no `Origin` (a server or script), and refuses one whose `Origin` names another site with a 403. As with `/api/client-error`, a reverse proxy in front of the app must pass the original `Host` header through. In `lowdefy dev`, the upgrade also needs a local `Host` (`localhost`, a `*.localhost` name or an IP address), the rule Vite applies to every other dev request. The same-origin rule now lives in one place, `isSameOriginRequest` in `@lowdefy/api`, used by every server.
