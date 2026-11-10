---
'@lowdefy/client-core': patch
'@lowdefy/engine': patch
---

fix: A live feed that subscribes as its connection is closing reconnects on its own

A live feed that started just as its websocket connection was closing went silent until the page was opened again. Serverless platforms close each connection after a set time (on Vercel, the function's maximum duration), so a page that subscribed in the last seconds of a connection got no answer, logged `Subscribe to "<id>" timed out.`, and never reconnected. The subscribe still reports the timeout, but the connection is now closed and opened again straight away and the feed is subscribed again, so its messages arrive without reopening the page.
