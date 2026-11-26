---
'@lowdefy/api': patch
---

fix(api): A request in a nested endpoint is keyed by its own endpoint

A request in an endpoint that another endpoint reached through a `CallApi` now reaches its resolver with that endpoint's id, not the id of the endpoint the call came in on. A journey stub, fail gate or `hold` narrowed with `endpoint` now matches it, and a `TenantIntegrityError` or walled-collection call names the endpoint whose routine holds the request.
