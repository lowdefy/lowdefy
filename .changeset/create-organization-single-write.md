---
'@lowdefy/api': patch
'@lowdefy/build': patch
'@lowdefy/plugin-better-auth': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

fix(api, plugin-better-auth): CreateOrganization writes the owner's app roles in one write

The `CreateOrganization` step now writes the organization and its creator's owner membership itself, with the `auth.organizations.creatorAppRoles` app roles on that membership from the start. It no longer creates the owner without app roles and adds them in a second write that had to be undone when it failed. A creator that is not a user, or a slug that is already taken, is refused before anything is written. The result still lists the owner under `members`.
