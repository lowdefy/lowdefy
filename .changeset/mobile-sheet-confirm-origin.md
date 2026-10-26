---
'@lowdefy/api': patch
---

fix(api): Phone sign-in sheet's Continue is no longer refused

The sign-in sheet's confirmation page sent `Referrer-Policy: no-referrer`, under which a browser posts its form with `Origin: null`, so the same-origin check refused every Continue with 403 and sheet sign-in (passkeys, SSO, magic link) could not finish. The confirmation page now uses `same-origin`; its url carries no secret, and the redirect that carries the token still sends no Referer.
