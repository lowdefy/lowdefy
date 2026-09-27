---
'lowdefy': patch
'@lowdefy/build': patch
---

fix: the Lowdefy hub no longer starts duplicate dev servers or leaves processes behind

- Two agent tool calls that start the same app at once (parallel tool calls, or two sessions) now share one dev server. Before, each launched one and the hub lost track of the first, which then ran until killed by hand. Two apps starting at once no longer get the same port pair.
- Hubs started together after a crash or a reboot no longer leave a second, unreachable hub running beside the one agents talk to. `lowdefy mcp` also opens one hub connection for parallel tool calls instead of starting a hub per call.
- When a dev server's manager is killed outright, the hub now stops the rest of its process group; Vite used to keep running and holding the app's internal port.
- The hub now stops a server whose git worktree was removed. The running server recreated its `.lowdefy` directory, so the hub never saw the worktree as gone. It also forgets the ports of removed apps, which otherwise stayed reserved until the port range ran out.
- A hub started from a session with a different time zone or locale no longer drops (and orphans) the dev servers it should adopt.
- A malformed line on the hub socket no longer crashes the hub.
- `lowdefy_dev_list` works from the root of a repository that holds several apps.
- `lowdefy dev` rebuilt pages with the action references of every page built before them in the session, and kept adding a failing page's references on every request.
