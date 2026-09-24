---
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

fix: Restore GenericOAuth client sign-in on BetterAuth 1.7.0.

BetterAuth 1.7.0 removed `genericOAuthClient` from its client plugin entry point. Both servers still imported it, so every client build failed on a clean install with `"genericOAuthClient" is not exported by "better-auth/client/plugins"` — apps could not be built or started at all.

The import and the plugin registration are dropped. Through BetterAuth 1.6.x this client plugin only carried an id, a version, an empty type-inference marker and the generic-oauth error codes — no actions, atoms, request hooks or route methods — so sign-in with a `GenericOAuth` provider works exactly as before without it.
