---
'@lowdefy/server-dev': patch
---

Inject the resolved caller into the dev page shell so client-side `_user` carries roles and organization_id under `lowdefy dev`, matching the production server. Without it, any page logic branching on `_user` misroutes in dev — under `auth.organizations.policy: tenant` a signed-in user bounced in an infinite dashboard → router → gate loop.
