---
'@lowdefy/client': patch
'@lowdefy/server': patch
---

fix(client,server): a tab left open across a deploy reloads instead of calling the new build with old config

A tab that loaded before a deploy, or that the browser restored from its cache,
kept sending its old page's requests, endpoint calls and auth calls to the new
server. A request or endpoint the new build renamed or removed failed, and one
whose payload changed shape could run with the wrong data. Each request and
endpoint call now names the build its page came from, and the production
server refuses a call from another build before running it; the tab reloads
once onto the current build. An auth call that fails against a newer build
reloads the tab the same way. Calls that name no build, such as third-party
webhooks, run as before.
