---
'@lowdefy/api': patch
---

fix(api): Phone sign-in sheet's Continue is no longer refused

The sign-in sheet's confirmation page sent `Referrer-Policy: no-referrer`, under which a browser posts its form with `Origin: null`, so the same-origin check refused every Continue with 403 and sheet sign-in (passkeys, SSO, magic link) could not finish. The confirmation page now uses `same-origin`; its url carries no secret, and the redirect that carries the token still sends no Referer.

A request counts as a phone shell's own only when it also carries no `Sec-Fetch-Mode`, which every current browser sends and page script cannot remove. A same-origin GET from page script with `credentials: 'omit'` sent neither Origin nor Cookie, so script holding a magic-link token could read the session token a phone gets.
