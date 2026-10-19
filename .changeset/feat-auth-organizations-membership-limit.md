---
'@lowdefy/build': minor
'@lowdefy/api': minor
---

feat(auth): Organizations no longer stop at 100 members; `auth.organizations.membershipLimit` sets a cap

BetterAuth's organization plugin caps every organization at 100 members, and past that accepting an invitation or adding a member fails with a 403. Under `pinned` every user of the deployment is a member of the one organization, so an app with more than 100 users could no longer onboard anyone. Lowdefy now defaults the cap to 1,000,000, effectively open. The new `membershipLimit` key sets a lower cap when you want one; it takes an integer (at least 1) and is validated at build time.

The same number is the default page size of `ListMembers` when no `limit` is given, so an unpaged `ListMembers` call now returns every member instead of the first 100.

```yaml
auth:
  organizations:
    policy: tenant
    membershipLimit: 50
```
