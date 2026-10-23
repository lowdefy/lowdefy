---
'@lowdefy/api': patch
'@lowdefy/docs': patch
---

fix(api): The accept page works for a pinned app's invitee on the dev server

Under `organizations.policy: pinned`, a signed-in user with a pending invitation to the app's organization now resolves as an awaiting-organization caller, as it already did under `tenant`: `_user.awaiting_organization` is `true` and `_user.pending_invitation_id` names the invitation. The server used to resolve them as signed out while the page showed them signed in, so every request from the accept page looked like it came from another user. The page reloaded until it failed with "The server answered as a different user or organization than this page shows". Only an invitation to the app's own organization counts, a user who already holds a member row there signs in again instead, and the caller is still refused on every page that is not public.
