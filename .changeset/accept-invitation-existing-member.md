---
'@lowdefy/api': patch
---

fix(api): Accepting an invitation into an organization you already belong to succeeds without a second membership

A user who was invited and then joined the organization another way (the open-signup auto-join, or an operator adding them) could accept the invitation afterwards. The accept wrote a second member row for them; with the unique member index Lowdefy now creates, it failed instead. Accepting now marks the invitation accepted and leaves the existing membership exactly as it is: no second row, and the invitation's role, app roles, attributes and profile are not applied, because an invitation is how someone joins an organization, never how a membership changes. When the session had no active organization, the organization becomes active and the session cookie is re-issued, as it is for a normal accept. Everything the accept route refuses first (an expired, used or someone else's invitation, an unverified email) is still answered by the route.
