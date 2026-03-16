---
'@lowdefy/api': minor
'@lowdefy/operators': patch
'@lowdefy/build': minor
---

feat: Internal API endpoint calls

**Endpoint-to-Endpoint Calls (`@lowdefy/api`)**

- API endpoint routines can call other endpoints server-side via `CallApi` steps, without HTTP
- Each called endpoint runs in an isolated context with its own `steps` and `payload` namespaces
- Recursive endpoint call depth is capped at 10 to prevent infinite loops
- `InternalApi` endpoints are blocked from HTTP access — they return the same response as a missing endpoint

**Build Support (`@lowdefy/build`)**

- `CallApi` routine steps validated at build time: require `properties.endpointId`, reject `connectionId`
- `InternalApi` endpoint type accepted alongside `Api`
- Client-side `CallAPI` actions targeting `InternalApi` endpoints produce a build warning (error in production)

**Operator Parser (`@lowdefy/operators`)**

- `ServerParser.parse()` accepts `steps` and `payload` per call for routine context isolation
