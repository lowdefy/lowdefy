---
'@lowdefy/server-dev': patch
---

fix(server-dev): Stop false "non-existent endpoint" warnings for CallAPI actions in dev.

Under `lowdefy dev`, every `CallAPI` action logged a `ConfigWarning` that its endpoint did not exist, even when the endpoint was correctly defined under `api:` and worked at runtime. A full `lowdefy build` was unaffected.

The JIT page builder validates CallAPI references against `context.components.api`, but the dev server's build context (`getBuildContext`) is rebuilt from disk artifacts and never restored the api endpoints, so the endpoint set was always empty and every reference was flagged. The dev context now hydrates the endpoints from the persisted `build/api/<endpointId>.json` artifacts (written by the skeleton build), so the non-existent-endpoint and InternalApi-not-client-callable checks behave the same in dev as in a full build.

Module endpoints are written to nested paths (`build/api/<moduleId>/<endpointId>.json`) because their scoped `endpointId` contains a `/`. The artifact reader now walks the api directory recursively so these endpoints are hydrated too; previously every module CallAPI was still flagged as referencing a non-existent endpoint.
