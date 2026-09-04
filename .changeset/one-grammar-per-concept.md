---
'@lowdefy/build': minor
'@lowdefy/engine': minor
'@lowdefy/node-utils': minor
'@lowdefy/errors': minor
'@lowdefy/server-dev': minor
'lowdefy': minor
'@lowdefy/codemods': minor
'@lowdefy/docs': patch
---

feat: one grammar per concept in `lowdefy.yaml`

A connection's `tenant` takes the bare tenant field name (`tenant: organization_id`), the same spelling `collections.<name>.tenant` uses; the `tenant: { field: … }` object form still builds and warns (`tenant-grammar`) and is removed in v9. `tenant: none` on a request or step is deprecated in favour of `runAs`, which keeps the tenant wall on instead of switching it off, and warns on every build (`tenant-none-deprecated`); `tenant: none` on a websocket is unaffected. `auth.dev.users` is the single declaration of a dev caller and `auth.dev.browserUser: <name>` selects the one the dev browser is signed in as; a name that is not declared fails the build listing the ones that are; `auth.dev.mockUser` warns (`auth-dev-mock-user`) and is removed in v9. A `CallAPI` action's result is read at `_actions.<id>.response.<path>` instead of `_actions.<id>.response.response.<path>`, with the call's `status`, `success` and `responseTime` read through `_api.<endpointId>`; the build rewrites the old spelling with a warning (`actions-response-envelope`) for this release. `migrations/`, `tests/journeys/`, `tests/requests/` and `fixtures/` share one discovery rule: recursive, byte-sorted, skipping `_` and `.` prefixed names, with the file's path below the directory as its name. Codemod prompts for the three renames ship in `@lowdefy/codemods` under `v8-0-0`.
