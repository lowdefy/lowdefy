---
'@lowdefy/api': patch
---

fix(api): Two sessions created at once for a user without an organization no longer mint two organizations.

Under `policy: tenant` with open signup and `create: auto`, the signup mint skips its own organization when that organization has members. When two sessions were created at the same time (a double submit, two tabs), the second one found the organization the first had just minted and joined, saw a member, and minted a second organization. The mint now reuses an organization whose members include the user, without adding another member row.
