---
'@lowdefy/client': patch
---

fix(client): A websocket subscribe that times out or is refused leaves nothing open

A subscribe whose acknowledgement times out on an open connection now sends an unsubscribe, so a server that handles the frame late does not open a feed nobody reads. A subscribe that times out or is refused also lets an otherwise idle connection close.
