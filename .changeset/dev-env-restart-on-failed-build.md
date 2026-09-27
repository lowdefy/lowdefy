---
'@lowdefy/server-dev': patch
---

fix(server-dev): A `.env` edit made while the config build fails now reaches the server. The server restarted only when the build after the edit succeeded, and a later successful build does not restart it, so the new environment was not used until something else restarted the server.
