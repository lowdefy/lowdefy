---
'@lowdefy/server-dev': patch
'lowdefy': patch
---

fix(server-dev): Journeys no longer fail on dropped dev server connections

Journeys failed now and then with the app error "Lowdefy dev server connection dropped.", and passed when run again. Synchronous work in the dev server's web server process, such as building a large page, can block its event loop for several seconds. A request the proxy had already sent on a reused connection was then lost, because Node's idle connection timer ran before the socket was read and closed the connection. The web server process now leaves idle connections open for the proxy to close, so the request waits for the block to end and is answered.

If the proxy still cannot reach the web server, for example because it crashed, the journey fails with `failure.kind: "dev-server"` and a `dev-server` line instead of an app error, since the result says nothing about the app. The proxy still does not replay a POST that may already have run.
