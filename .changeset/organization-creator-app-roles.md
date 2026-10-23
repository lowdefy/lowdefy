---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/docs': minor
'@lowdefy/docs-content': minor
---

feat(api, build): The owner of a new organization can get app roles

A new signup under `organizations.policy: tenant` with `create: auto` became the `owner` of their own organization with no app roles, so in an app that gates pages, endpoints and menus on app roles, every gated page was closed to them in their own organization. The new `auth.organizations.creatorAppRoles` setting lists the app roles the owner of a new organization gets on their membership:

```yaml
auth:
  roles:
    - id: workspace-admin
  organizations:
    policy: tenant
    creatorAppRoles:
      - workspace-admin
```

It applies to the organization a tenant signup mints and to the `CreateOrganization` step when it is given a creator. The owner's organization tier stays `owner`; invited members and users auto-joined to a pinned organization are unchanged. Every listed id must be declared in `auth.roles`, or the build fails naming the unknown id. Unset, it defaults to `[]` and owners get no app roles, as before. Existing memberships are left as they are.
