---
'@lowdefy/journey-headless': minor
'@lowdefy/node-utils': minor
'@lowdefy/server-dev': minor
'@lowdefy/test-utils': minor
---

feat(journey-headless): A journey call can run as the system bound to an organization

A journey `call` made `as: system` ran the endpoint bound to no organization, so an `InternalApi` endpoint that runs per organization, as a scheduled run's `CallApi` with `organization` reaches it, could not run in a journey. A production app's journeys for such endpoints could only reach them nested through a public endpoint.

- `as: { system: { organization, caller } }` binds the call to an organization and a stand-in caller. The endpoint gets exactly what a `CallApi` with `organization` and `caller` gives its target: the tenant wall filters and stamps with the organization, and `_user` is `{ id, name, organization_id, system: true }`. `caller` is optional, as on `CallApi`; without it `_user` is null. Both forms run headless only, on a build and on the dev server.
- The call goes through the same system principal a detached call from such a `CallApi` carries, so a journey and production give the endpoint one binding.
- When a call `as: system` bound to no organization is refused or its routine fails, the failing step (`expect.status`, `expect.error`, or the server error its routine raised) says how to name the organization.
- Endpoint tests take the same binding: `session.system({ organization, caller }).call(endpointId, payload)`.
- An inline user object still can not carry `system`. A journey whose `user` carries it is now refused before it runs, by `lowdefy test` and by the dev server's journey routes, where it used to fail inside the run.
