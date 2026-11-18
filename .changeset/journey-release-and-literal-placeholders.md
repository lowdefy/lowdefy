---
'@lowdefy/node-utils': patch
'@lowdefy/journey-headless': patch
'@lowdefy/test-utils': patch
'@lowdefy/server-dev': patch
---

fix(journey-headless): `release` names a hold as `hold` does, and a journey sent to the dev server takes `_ref` and `_case` inside values as data

- `release` takes `release: <requestId>` or `release: { requestId, endpoint?, pageId? }`, matched on the request the parked call reached, so two holds on one request id in different routines release in either order.
- The dev server's journey route and `lowdefy_run_journey` refuse a `_ref` or `_case` only where a journey file's placeholder could have been meant: a step, a step list, `cases`, a stub or the stub list, `user`, `data` or `pageId`. Inside a payload, a stub answer, a `match` or an expected value it is sent as written.
