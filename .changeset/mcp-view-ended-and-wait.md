---
'@lowdefy/api': patch
'@lowdefy/client': patch
'@lowdefy/server': patch
'lowdefy': patch
---

fix(mcp): Stop an ended view and show the fallback when a view waits too long.

A view that ends now unmounts its page and closes its websocket, so nothing keeps running behind the fallback. A view whose host has not connected, whose app has not answered or that has had no tool result after 20 seconds shows the fallback with a line saying the page is slow, and loads the page if what was missing still comes. Sentry is not started in a view: a view may call only the app's origin and those in `mcp.viewSources`.
