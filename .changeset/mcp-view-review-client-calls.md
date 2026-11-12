---
'@lowdefy/client-core': patch
'@lowdefy/client': patch
'@lowdefy/shell': patch
---

fix: An endpoint call from a page shown as an MCP App view carries its bundle's build id, so the server refuses a view still running an earlier build, as it does a browser tab. The exemption was keyed on the bearer transport, which a view shares with a native shell; the shell's host now states it with `callsEndpointsAcrossBuilds`, and its endpoint calls carry no build id as before. A view's websocket no longer mints a session for every failed connect: it mints when it holds none, when the held session has reached its expiry, or after the server closed the socket for a caller change, and at most three times in fifteen minutes for a session that has not expired.
