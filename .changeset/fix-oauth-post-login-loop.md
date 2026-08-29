---
'@lowdefy/api': patch
---

fix: The MCP post-login organization choice no longer loops back to the picker.

The oauth-provider asks `postLogin.shouldRedirect` again on the authorize call that `/oauth2/continue` re-enters with, and only its consent redirect carries the "post-login done" marker — so choosing an organization sent the user straight back to the picker. A request hook on `/oauth2/continue` now stamps the request's cached session when the choice is confirmed, and `shouldRedirect` reads that stamp: the picker shows once per authorization, then the flow proceeds to consent.
