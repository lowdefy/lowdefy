---
'lowdefy': patch
'@lowdefy/docs': patch
---

The Vercel function `lowdefy vercel-output` generates stops a `GET` stream, such as an MCP client's notification stream, when its client disconnects, instead of reading it until `maxDuration`. Other responses, such as an agent run, still run to the end. Websocket upgrade requests now get the protocol and host from Vercel's forwarding headers, like every other request, so `context.origin` is the deployment's `https://` origin on websocket connections too.
