---
'@lowdefy/api': patch
'@lowdefy/build': patch
'@lowdefy/client': patch
'@lowdefy/plugin-better-auth': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

fix: Restore GenericOAuth sign-in on BetterAuth 1.7.

BetterAuth 1.7.0 removed `genericOAuthClient` from its client plugin entry point. Both servers still imported it, so every client build failed on a clean install with `"genericOAuthClient" is not exported by "better-auth/client/plugins"` — apps could not be built or started at all. The import and the plugin registration are dropped.

BetterAuth 1.7 also removed the generic OAuth plugin's own routes. A `GenericOAuth` provider is now registered as a social provider under its id: it signs in through `/api/auth/sign-in/social` and returns on `/api/auth/callback/<id>`, like any built-in provider. The `Login` action now signs a `GenericOAuth` provider in through that route with the provider's `id`, instead of the removed `/api/auth/sign-in/oauth2`. The callback URL to register with the identity provider is `/api/auth/callback/<id>`, with the provider's Lowdefy `id`.

Built-in and `GenericOAuth` providers now share one id namespace, so the build fails when a `GenericOAuth` provider's `id` is the provider key of a built-in provider the app also configures (for example `id: google` alongside `type: Google`). BetterAuth would otherwise send that built-in provider's sign-ins to the `GenericOAuth` one.
