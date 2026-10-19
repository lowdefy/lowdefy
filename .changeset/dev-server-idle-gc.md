---
'@lowdefy/server-dev': patch
---

fix(server-dev): Dev server frees unused memory when it goes quiet

The dev server's two processes grow their JavaScript heap during config builds and page loads, and Node did not give that memory back while the server sat idle. The dev server now runs one full garbage collection when it goes quiet: the build process 5 seconds after a build ends, and the Vite server process once nothing has used the server for 10 seconds and nothing is in flight. It runs again only after the server is used again, and never during a build or a request.
