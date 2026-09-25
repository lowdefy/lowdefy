---
'@lowdefy/connection-mongodb': patch
---

fix(connection-mongodb): The MongoDB auth adapter recovers from a failed first connect. The driver closes a client whose first connect fails and then keeps reusing the closed topology, so one timed-out handshake (a serverless instance frozen mid-connect, a network blip) left every sign-in, session and OAuth call on that process failing with `Topology is closed` until the instance was recycled. The adapter now replaces the client as soon as its topology closes, so only the request that hit the failed connect errors.
