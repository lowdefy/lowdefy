---
'@lowdefy/connection-mongodb': patch
---

fix(connection-mongodb): A `MongoDBChangeStream` source resumes after a replica set election

When a replica set elected a new primary, a `MongoDBChangeStream` websocket source could end with `MongoServerError` code 11602 (InterruptedDueToReplStateChange). The driver did not resume it because the server sent the error without the `ResumableChangeStreamError` label, so every subscriber dropped at once, reconnected and reloaded as the new primary came up.

The source now keeps the resume token of the last change it published. When the stream fails with a resumable error (codes 11602, 10107, 13435, 189 and 91, an error labelled `ResumableChangeStreamError`, or a network or server selection error), it reopens the stream with the same pipeline after that change, and keeps publishing to the same subscribers. It waits 0.5 s, 1 s, 2 s and then 4 s between attempts, and gives up and throws as before once the stream has kept failing for about 30 s (longer when the last attempt is still waiting for a primary to be elected). A resume that finds its history gone from the oplog (code 286) or a fatal stream error (code 280) throws as before, so subscribers reconnect and reload. Other errors and aborts behave as before.
