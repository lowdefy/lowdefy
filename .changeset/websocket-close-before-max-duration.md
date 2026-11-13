---
'@lowdefy/server': patch
'lowdefy': patch
---

fix(server): Websockets on Vercel reconnect at once when the function's time limit ends them

On Vercel every websocket ends when the function reaches `config.vercel.maxDuration`. Vercel stops the function without closing the connection, so the browser only noticed about 10 to 12 seconds later, and pages heard no live updates in that gap: about 9% of the time with a 120-second limit. Changes made in the gap never reached the page. The server now closes each websocket 5 seconds before the limit (at half the limit when it is under 10 seconds), and the client reconnects and resubscribes straight away. The Node server is unchanged.
