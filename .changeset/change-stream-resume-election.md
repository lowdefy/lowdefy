---
'@lowdefy/connection-mongodb': patch
---

fix(connection-mongodb): A `MongoDBChangeStream` source resumes after a replica set election

When a replica set elected a new primary, a `MongoDBChangeStream` websocket source could end with `MongoServerError` code 11602 (InterruptedDueToReplStateChange). The driver did not resume it because the server sent the error without the `ResumableChangeStreamError` label, so every subscriber dropped at once, reconnected and reloaded as the new primary came up.

The source now keeps the driver's resume token, which moves on with each change and each server answer, so a quiet stream that published nothing yet keeps its place too. When the stream fails with a resumable error (every code the driver resumes on, such as 11602 and 11600, an error labelled `ResumableChangeStreamError`, or a network or server selection error), it reopens the stream with the same pipeline at that token, and keeps publishing to the same subscribers without missing a change. It waits 0.5 s, 1 s, 2 s and then 4 s between attempts, and throws once about 30 s pass with no reopened stream answered (longer when the last attempt is still waiting for a primary to be elected). A stream that is answered again restarts those 30 s. A resume that finds its history gone from the oplog (code 286) or a fatal stream error (code 280) throws straight away. When the source throws, the server restarts it from the current point and, once it is listening, fires the page's `onSubscribe` so it can fetch what it missed. Other errors and aborts behave as before.
