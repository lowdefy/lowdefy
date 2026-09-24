---
'@lowdefy/build': minor
'@lowdefy/api': minor
---

feat(auth): `auth.organizations.invitationExpiresIn` sets how long organization invitations stay acceptable

Invitations expired after BetterAuth's fixed 48 hours, which is too short for real invitees who open the email days later. The new key takes seconds (at least 60) and is validated at build time; re-sending an invitation refreshes its expiry as before. Unset, the 48-hour default still applies.

```yaml
auth:
  organizations:
    policy: tenant
    invitationExpiresIn: 1209600 # 14 days
```
