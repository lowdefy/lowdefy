---
'@lowdefy/server-dev': minor
'lowdefy': minor
'@lowdefy/node-utils': minor
'@lowdefy/helpers': minor
---

feat: The dev server records journeys

`lowdefy dev` now records how you use your app in the browser, locally, so an agent can turn what you tried into journeys. Recordings stay in `.lowdefy/traces/` on your machine, are kept for 7 days or 200 MB, and never include password fields. Set `LOWDEFY_DEV_RECORD=false` to turn recording off. `lowdefy agent-setup` now also installs a `journeys-from-dev` skill.
