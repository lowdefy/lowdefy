---
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

fix(servers): Answer unserved /.well-known/* paths with 404 instead of the app shell

Well-known URIs are machine-facing, but any path outside the deployment's own OAuth
discovery documents fell through to the page catch-all and answered 200 text/html.
Clients probing discovery documents - an MCP client's OAuth probe, for example -
failed with "Failed to parse JSON" instead of learning there is nothing to discover.
Unserved well-known paths now answer 404 JSON; the real discovery documents are
unchanged.
