---
'@lowdefy/api': patch
'@lowdefy/client': patch
---

fix(api): Challenge id token sign-in for a second factor.

With two-factor enabled, an id token posted straight to `/api/auth/sign-in/social` signed a user in without their second factor. That route verifies the token and creates the session in the same request, so it never reaches the OAuth callback where the challenge runs. It applies to every provider BetterAuth can verify id tokens for: built-in providers such as Google and Apple, and `GenericOAuth` providers configured with a `discoveryUrl`. These sign-ins are now challenged like the OAuth callback, unless the provider sets `twoFactorTrusted: true`. A `Login` action that passes an `idToken` param now navigates to `authPages.twoFactor` on the challenge, as password sign-in does.
