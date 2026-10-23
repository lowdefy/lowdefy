---
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

fix(servers): A session the server refuses no longer reloads the page until it fails

When the server resolves a signed-in session to no caller (a removed member, or an invitee whose invitation expired or was cancelled after sign-in), the browser used to render the session's user anyway. Every response then named a different caller than the page showed, so the page reloaded and failed with "The server answered as a different user or organization than this page shows". The page now renders no caller in that case, matching the server. After a client-side sign-in with no navigation, the page asks `/api/user` once for the signed-in caller instead of rendering the session's user without roles or organization.
