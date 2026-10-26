---
'@lowdefy/client': patch
'@lowdefy/docs': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

fix(client): A sign-in that stays on the page renders the signed-in user before the action returns

A sign-in with `callbackUrl: false`, which stays on the page, now finishes by asking the server who signed in, as `UpdateSession` does, and renders that user before the `Login` action returns. The next action in the chain, such as a request, is answered as the user the page shows. Before, that request could reload the page and lose the page's state. If the page cannot get the signed-in user from the server, it reloads in place rather than failing a sign-in that succeeded.
