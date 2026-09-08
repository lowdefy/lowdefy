---
'@lowdefy/actions-core': patch
'@lowdefy/email-templates': patch
'@lowdefy/operators-js': patch
'@lowdefy/server-dev': patch
'@lowdefy/server': patch
'@lowdefy/engine': patch
'@lowdefy/client': patch
'@lowdefy/build': patch
'@lowdefy/docs': patch
'@lowdefy/api': patch
---

feat(api,client,build): email one-time code sign-in, and the magic-link email carries the code

Magic-link sign-in fails behind corporate mail security that opens links before the
person does: the scanner follows the link, the single-use token is spent, and the
click that follows is rejected. Apps can now offer a one-time code instead. Enable
`auth.emailOTP` and the app emails a short code the person types into the tab they
started from, which no link scanner can consume, and which also works when the email
is read on a different device from the one signing in. Two new actions drive it,
`EmailOtpSend` and `EmailOtpVerify`.

With both `auth.magicLink` and `auth.emailOTP` enabled, the magic-link email carries
the code as well, so one email serves both paths and nothing about the existing
`Login` flow changes: the person clicks the button, or falls back to typing the code.
