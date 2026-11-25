---
'@lowdefy/journey-headless': patch
'@lowdefy/server-dev': patch
'@lowdefy/test-utils': patch
---

fix(journey-headless): `_credential` works in headless journeys

A routine step that used `_credential` failed in `lowdefy test --headless --build` with "A credential can only be marked while the server handles a request.", so no headless journey could reach an endpoint that marks a credential, such as one that signs a webhook with a derived secret. The server runs each request in a credential scope; the headless runner called endpoints without one.

- Every call, system call and webhook a headless journey makes now runs in a credential scope of its own, as the server runs each request, on a build and on the dev server.
- The values a routine marks are scrubbed, as the server scrubs its logs, from the requests the data session records and from the server faults a journey prints.
