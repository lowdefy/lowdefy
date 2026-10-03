---
'@lowdefy/node-utils': patch
'lowdefy': patch
---

fix: The dev hub skips ports Windows will not bind, and a restarted dev server is no longer reported as exited

On Windows, ports in an excluded range (reserved by Hyper-V, WSL or Docker) refuse to bind with `EACCES`. The port check threw on that error, so `lowdefy hub` failed to start a dev server whenever its port range crossed one. A port that cannot be bound now counts as taken, and the next free one is used.

Restarting a hub-managed dev server on Windows could report the new server as exited while it was still starting, because the old server's exit arrived after the new one launched. An exit now counts only for the server that is current for the app.
