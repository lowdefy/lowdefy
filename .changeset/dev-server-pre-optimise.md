---
'@lowdefy/server-dev': patch
---

fix(server-dev): Optimise client dependencies in a short-lived process so the dev server does not keep the optimiser's memory

Vite's dependency optimiser keeps about 500 MB of native memory after it runs, and only ending the process gives it back. The dev server's Vite process used to run it whenever its cache was cold (every new checkout or worktree, and after every plugin install) and then held that memory for the rest of the session. The dev server now runs the optimiser in a separate process that exits before the Vite server starts, at start-up and before the restart that follows a plugin install, so the Vite server always starts with a warm cache. Measured on a small app after a page load and a screenshot from a cold cache: the Vite process took 627 MB instead of 1,248 MB. No extra restart happens, so open browser tabs are not reloaded for it. If the separate step fails, the dev server warns and optimises as before.
