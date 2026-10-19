---
'lowdefy': patch
---

fix(cli): Websockets connect on Vercel. The function entry that `lowdefy vercel-output` generates exported a request handler that ran the Hono app without the upgrade hooks `@hono/node-server` provides, so every `/api/websocket` request failed with a 500 (`Cannot read properties of undefined (reading 'Symbol(WAIT_FOR_WEBSOCKET_SYMBOL)')`) and page subscriptions timed out. The entry now exports a Node HTTP server, which Vercel's Node runtime serves with WebSocket upgrades (Fluid compute): upgrades go through `@hono/node-server`'s WebSocket support, and every other request still goes through the handler that buffers the request body before running the app.
