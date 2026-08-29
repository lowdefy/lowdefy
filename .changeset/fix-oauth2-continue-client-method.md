---
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

fix: Expose `oauth2Continue` on the client auth methods so the `OAuthContinue` action works.

The post-login organization picker's `OAuthContinue` action failed with "auth.oauth2Continue is not a function": the client's fixed method table only carried `oauth2Consent`. Both servers now hand `oauth2Continue` (POST `/oauth2/continue`) through with the same signed-query contract.
