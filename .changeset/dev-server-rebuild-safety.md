---
'@lowdefy/build': patch
'@lowdefy/server-dev': patch
---

fix(server-dev): Dev server rebuilds no longer break requests, websockets or plugin types, and the file watch covers every file the build reads

- **Requests during a rebuild.** A config rebuild emptied the build folder and wrote the new build back file by file, so a request that arrived in that window failed with `API Endpoint "x" does not exist.` or `Connection "x" does not exist.`. The dev server now builds into a separate folder and moves each file over the live build, so every request finds a complete build, old or new. A failed build leaves the running build in place.
- **Websocket upgrades.** The request context of a websocket upgrade is now passed along with the upgrade request instead of through a module shared between the upgrade handler and the websocket route, which could stop live connections from connecting after a rebuild. A refused upgrade now answers with the route's status and logs why.
- **Adding a page to the pages list rebuilds.** The file that holds the pages list (`pages: { _ref: pages.yaml }`, or a module's pages list) is now treated as app config, so adding a page to it rebuilds and the page is served.
- **Files outside the app folder are watched.** Files the build reads outside the config folder and local module folders, such as a file a local module refs with `../`, now trigger a rebuild or page reload when edited. Local modules outside the config folder are watched by the same watcher.
- **Apps inside a dot-folder are watched.** Dotfiles are now ignored relative to the watched folder, so an app in a git worktree under a folder such as `.claude/worktrees/` sees its edits.
- **New plugin types after a restart.** Plugin type lists are read fresh on every build, and a restart from the dev tools (`lowdefy_restart`, or `lowdefy_dev_start` with `restart: true` on a terminal-started server) rebuilds the config first, so a block, request or operator type added to a local plugin is defined without stopping the dev server.
