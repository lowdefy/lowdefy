---
'@lowdefy/build': patch
'@lowdefy/client': patch
'@lowdefy/engine': patch
'@lowdefy/helpers': patch
---

fix(client): a read the host fails is sent once more, and a non-JSON error says what happened

A host can answer a request itself before the app runs, with a plain-text body: a serverless platform's own 500 ("A server error has occurred"), a gateway error or the request timeout's 504. The client parsed every error body as JSON, so the action failed with `Unexpected token 'A', "A server e"... is not valid JSON`.

Such a response now becomes a `NonJsonResponseError` carrying the status and the start of the body. A 504 says "The request timed out. Try again." and any other status says "The server could not answer (status N). Try again." A page request that only reads is sent once more first, with a console warning: the build marks a request `readOnly` when its plugin's `requestMetas` say its type never writes and any pipeline it has is a literal list without `$out` or `$merge`. Writes, endpoint calls (`CallAPI`) and request types without metadata are never sent again, and a JSON error from the app is never retried.
