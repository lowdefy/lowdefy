---
'@lowdefy/client': patch
'@lowdefy/actions-core': patch
'@lowdefy/build': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

`RequestPasswordReset` without `redirectTo` now sends the reset link to the `auth.authPages.resetPassword` page (default `/reset-password`), which receives `?token=`, or `?error=INVALID_TOKEN` when the link is invalid or expired. Before, the emailed link failed without a `redirectTo`. An explicit `redirectTo` still wins. The build warns when the app sends password reset email (`auth.email` with `emailAndPassword` enabled) and `authPages.resetPassword` names a page the app does not have.
