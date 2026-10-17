---
'lowdefy': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

fix: The `journeys-autopilot` skill no longer stops on an app whose `package.json` has several scripts running `lowdefy dev`. Its first cycle sets `cli.devScript` in `lowdefy.yaml` to the script whose name marks it the development one, never one that names production or staging, commits it with the ledger and says why in the pull request. When no single script qualifies, it stops and names the scripts.
