---
'@lowdefy/client': patch
---

fix(client): Keep websocket subscriptions alive when a feed is subscribed again before its first subscribe is acknowledged.

Unsubscribing and subscribing to the same websocket feed while the first subscribe was still waiting for the server (for example while the connection was opening) could silently drop the feed about ten seconds later, so it stopped receiving messages and was not resubscribed after a reconnect. The earlier subscribe now settles when it is replaced, and its timeout no longer affects the newer subscription. A subscribe resent after a reconnect now gets a fresh timeout instead of counting time spent reconnecting, and a resubscribe the server never answers now reports a "timed out" error through the subscription's `onError` event instead of leaving the feed disconnected with no error.
