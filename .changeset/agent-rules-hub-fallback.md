---
'lowdefy': patch
---

fix(cli): Agent rules say what to do when the Lowdefy tools are missing

The rules `lowdefy agent-setup` writes told agents never to run `lowdefy dev`, but not what to do when their session has no `lowdefy_` tools, which happens when an agent client does not start the MCP server or drops it when a session resumes. Agents then started dev servers by hand on ports they picked, outside the hub's start limits and idle shutdown. The rules now say to run `npx lowdefy@<version> hub start <app>`, `hub logs` and `hub stop` instead, for apps in the agent's own checkout, to read build status from the dev server's `/lowdefy-docs/build-status` route, to tell the developer that `lowdefy agent-setup --user` registers the tools for every session, and to point a browser or preview pane at the server's URL rather than configure the pane to start a second server. Rerun `lowdefy agent-setup` to update a project's rules.
