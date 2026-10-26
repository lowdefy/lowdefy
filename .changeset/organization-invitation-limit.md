---
'@lowdefy/build': minor
'@lowdefy/api': minor
---

feat(auth): Organizations no longer stop at 100 open invitations; `auth.organizations.invitationLimit` sets a cap

BetterAuth's organization plugin refuses a new invitation once an organization has 100 open ones, with a 403. Under `pinned` every user of the deployment is invited into the one organization, so a busy app or a bulk invite run could hit the cap and stop inviting anyone. Lowdefy now defaults the cap to 1,000,000, effectively open. The new `invitationLimit` key sets a lower cap when you want one; it takes an integer (at least 1) and is validated at build time.

Only pending, unexpired invitations count. Past the cap, inviting fails with a 403 and code `INVITATION_LIMIT_REACHED`.

```yaml
auth:
  organizations:
    policy: tenant
    invitationLimit: 200
```
