---
'@lowdefy/node-utils': patch
'@lowdefy/journey-headless': patch
'@lowdefy/test-utils': patch
'@lowdefy/server-dev': patch
---

fix(journey-headless): `release` names a hold as `hold` does, and a journey sent to the dev server takes `_ref` and `_case` inside values as data

- `release` takes `release: <requestId>` or `release: { requestId, endpoint?, pageId? }`, matched on the request the parked call reached, so two holds on one request id in different routines release in either order.
- A call parked at a hold that shares its request id with another bare hold is named by its own routine in the hint after it: `release: { requestId, endpoint }`.
- When that release would also let go another parked call, the hint names the step of the call's hold, and suggests `release: { requestId, endpoint, pageId }` when that names only this call, or else names the calls parked before it that the release lets go first.
- The dev server's journey route and `lowdefy_run_journey` refuse a `_ref` or `_case` only where a journey file's placeholder could have been meant: a step, a step list, a stub or the stub list, `user`, `data`, `pageId`, or `pathParams` and `urlQuery` or one of their values. Inside a payload, a stub answer, a `match` or an expected value it is sent as written. A sent journey with a `cases` table is refused, pointing to `lowdefy test`.
