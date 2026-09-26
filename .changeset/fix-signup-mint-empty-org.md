---
'@lowdefy/api': patch
---

fix(api): The tenant signup mint reuses a user's own organization only when it has no members.

Under `policy: tenant` with open signup and `create: auto`, a user with no membership gets their own organization at their next session, slugged `org-<userId>`. The mint reused that organization whatever its members and made the user its owner again, so someone who handed their signup organization to others and was later removed from their last organization came back as its owner. It now reuses the organization only when it has no members (the half-finished mint the reuse exists for). When it has members, the user gets a fresh organization on the next slug (`org-<userId>-2`, then `-3` and on), with the same orphan reuse and unique-slug race handling on each slug.
