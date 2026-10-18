---
'@lowdefy/api': minor
'@lowdefy/client-core': minor
---

feat: The phone sign-in sheet's one-time token is bound to PKCE

`/auth/mobile` now requires a PKCE challenge (RFC 7636, S256): `code_challenge`, the 43-character base64url SHA-256 of the shell's code verifier, and `code_challenge_method=S256`. Without them it answers 400. The challenge is stored with the one-time token, and `/api/auth/one-time-token/verify` exchanges the token only when the request also sends `code_verifier`, the verifier the challenge was made from. A missing or wrong verifier is refused and burns the token, so a token another app catches from the shell's custom scheme on Android cannot be exchanged.

`createPkceChallenge({ verifierBytes, sha256 })` in `@lowdefy/client-core` makes the verifier and challenge from random bytes and the platform's SHA-256.
