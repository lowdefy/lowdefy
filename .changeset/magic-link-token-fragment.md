---
'@lowdefy/api': minor
'@lowdefy/client-core': minor
'@lowdefy/engine': patch
'@lowdefy/operators-js': minor
'@lowdefy/actions-core': patch
'@lowdefy/shell': patch
'@lowdefy/docs': patch
---

feat: Keep the magic-link token out of URLs the server receives

With `auth.authPages.magicLink` set, the sign-in email links to the landing page with the token and callback destinations in the URL fragment (`/magic-link#token=…&callbackURL=…`) instead of the URL query. A browser never sends the fragment, so the token no longer lands in the server's request logs, a host's firewall logs or log drains, or `Referer` headers. `MagicLinkVerify` reads its defaults from the fragment, falling back to the URL query so links emailed before the upgrade keep working. It clears the fragment from the address bar and browser history, then posts the token in a form to `POST /api/auth/magic-link/verify` rather than navigating to Better Auth's `GET` verify URL. The server refuses that post with a 403 unless its `Origin` is the request's own host, the pinned base URL (`BETTER_AUTH_URL` or the environment's `url`) or a trusted origin (a null `Origin` passes only with `Sec-Fetch-Site: same-origin`, as a same-origin post sends under `Referrer-Policy: no-referrer`), and otherwise hands Better Auth its own `GET` verify request, so sign-in, errors and redirects work as before. Better Auth's `GET` verify route stays for apps with no landing page.

The new client operator `_url_hash` reads the URL fragment, parsed as a query string, with the same arguments as `_url_query`. A landing page that shows its button only when `_url_query: token` is set should read `_if_none: [{ _url_hash: token }, { _url_query: token }]` instead, so new links and links emailed before the upgrade both show it.
