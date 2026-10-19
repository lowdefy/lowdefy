---
'@lowdefy/api': patch
---

fix(api): A websocket re-subscribe that fails leaves nothing open

A re-subscribe to an open websocket (the `Subscribe` action with a changed payload) removes the previous subscription before preparing the new one. A re-subscribe that fails, such as one the caller is not authorized for, no longer leaves the previous channel running for a client that has stopped reading it.
