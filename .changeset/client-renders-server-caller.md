---
'@lowdefy/client': patch
'@lowdefy/docs': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

fix(client, server, server-dev): A page no longer fails for a session the server refuses

A page now renders the caller the server resolved, and nobody when the server resolved nobody, even while a session is signed in. It used to build a caller from the session in that case, so every request from the page looked like it came from another user, and the page reloaded until it failed with "The server answered as a different user or organization than this page shows". This happened to a session that is signed in but no longer let in: an invitee to a pinned organization whose invitation was cancelled or expired, a session active in another organization than the pinned one, or a member removed while signed in.

A sign-in with `callbackUrl: false`, which stays on the page, now finishes by asking the server who signed in, as `UpdateSession` does, and renders that user before the `Login` action returns. The next action in the chain, such as a request, is answered as the user the page shows. Before, that request reloaded the page and lost the page's state.
