---
'@lowdefy/api': patch
'@lowdefy/client': patch
---

fix: Websocket subscribes and unsubscribes are handled in the order they are sent, and each reply is matched to the subscribe it answers.

The server handled a connection's frames concurrently, so an unsubscribe sent while a subscribe was still being set up ran first and removed nothing. The subscription and its source then kept running for a page that had left, until the connection closed. The server now handles each connection's frames in order, and a subscribe that finishes after its connection closed is removed.

Subscribe frames now carry a `requestId` that the server echoes in its reply, so a late reply to a subscribe that a newer one replaced no longer settles or fails the newer subscribe. A server that does not echo the id is still matched by websocket id.

The browser client also keeps an idle connection open until its publishes are answered, closes a connection that finishes opening after its last feed was unsubscribed, and resets its reconnect backoff only after a connection has stayed open for ten seconds, so a server that drops connections straight after accepting them is not retried every half second.
