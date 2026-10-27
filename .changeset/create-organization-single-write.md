---
'@lowdefy/api': patch
'@lowdefy/build': patch
'@lowdefy/plugin-better-auth': patch
---

fix(api, plugin-better-auth): CreateOrganization writes the owner's app roles in one write

The `CreateOrganization` step now writes the organization and its creator's owner membership the same way a tenant signup does, with the `auth.organizations.creatorAppRoles` app roles on that membership from the start. It no longer creates the owner without app roles and adds them in a second write that had to be undone when it failed. If a run fails after writing the organization but before its owner, running the step again with the same creator and slug within ten minutes finishes it, instead of leaving an organization with no owner. Nothing is written until the database's unique indexes are in place.

The step now checks its properties itself. It takes `name` and `slug` (non-empty strings, required), `logo` (string), `metadata` (object) and `userId` (string), and refuses any other property, so options such as `keepCurrentActiveOrganization` are no longer accepted. A creator that is not a user, or a slug another organization holds, is refused before anything is written. A missing `userId` now always means an organization with no members; it is no longer taken from the caller. The result still lists the owner under `members`.
