---
'@lowdefy/server-dev': minor
---

feat(server-dev): Data set journeys record requests to outside services instead of refusing the click

A data set journey refused any click whose events could reach a mail, HTTP, payment or other outside-service connection somewhere in an endpoint's routine, including on a branch the click never takes, so most write endpoints of a real app could not be tested. Under a data set run the requests of those connections are now recorded and answered with `null`, and never sent; the click rails only refuse what cannot be sunk. The run's result lists them as `sunk`, with the connection, request and evaluated request properties (secrets scrubbed). Mail sent to the dev server's mail capture still reaches it, so the `email` step keeps working.
