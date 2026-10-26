---
'@lowdefy/engine': minor
'@lowdefy/client-core': minor
'@lowdefy/shell': minor
'@lowdefy/blocks-native': minor
'@lowdefy/build': minor
---

feat(mobile): Offline request queue for `offline: queue` requests

A request with `offline: queue` is kept by a mobile shell while it has no signal, or when the send fails for the network, and sent in order when the signal returns or the app starts. The action resolves with `{ queued: true, id }`. The payload is evaluated once, when the action runs, and sent unchanged, so a `_uuid` in the payload is a stable idempotency key. A 2xx removes the request; any other server answer marks it failed with the server's message until `RetryRequestQueue` or `DiscardQueuedRequest`. The `onRequestQueue` app event and `GetRequestQueue` report `{ pending, failed, items }`. Sign-out clears the queue. On the web the key is ignored. The engine passes the request's `offline` to the core's `callRequest`, which sends it through a host's `requestQueue` when the host has one.
