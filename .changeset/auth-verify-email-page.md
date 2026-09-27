---
'@lowdefy/client': major
'@lowdefy/actions-core': patch
'@lowdefy/build': minor
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

`authPages.verifyEmail` is where the emailed verification link lands.

- **Breaking:** `SignUp` and `SendVerificationEmail` without a `callbackUrl` now send the verification link to the `auth.authPages.verifyEmail` page (default `/verify-email`) instead of the `?callbackUrl=` query or the home page. The page receives `?error=` (`INVALID_TOKEN`, `TOKEN_EXPIRED`) when the link is invalid or has expired, so it can offer to resend. An explicit `callbackUrl` still wins, and a `SignUp` that returns a session still navigates to the `?callbackUrl=` query or the home page.
- The build warns when the app sends verification email (`auth.email` with `emailAndPassword` enabled) and `authPages.verifyEmail` names a page the app does not have.
