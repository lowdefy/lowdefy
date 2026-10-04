---
'@lowdefy/api': minor
'@lowdefy/build': patch
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
---

feat: Webhook verifiers get the raw request body as `rawBody`.

A webhook endpoint's `verify` request now receives `{ body, rawBody, query, headers }`, where `rawBody` is the request body exactly as received, as a string. Senders such as GitHub (`X-Hub-Signature-256`), Stripe and Slack sign the exact bytes they post, which serialising the parsed `body` again does not reproduce, so a signature check reads `_payload: rawBody`. A body that is not JSON reaches the verifier as `rawBody` too. `rawBody` is given only to the verifier: the routine's payload stays `{ body, query, headers }`.
