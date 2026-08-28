---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/server-dev': minor
'lowdefy': minor
---

feat: Support running multiple dev apps side by side.

Running several Lowdefy dev servers on `localhost` previously clashed on
ports and shared a single auth cookie jar (browsers scope cookies by host,
not port), so logging into one app logged you out of another. Three changes
make concurrent dev apps work:

- **Per-app auth cookies.** Cookie names are now resolved through a
  precedence chain: an explicit `auth.advanced.cookies` is used verbatim;
  otherwise an explicit `auth.advanced.cookiePrefix` namespaces the cookie
  names (dev and prod); otherwise the dev server derives a prefix from the
  app `slug`/`name` so each app gets its own cookie jar. Production with no
  config is unchanged (Auth.js defaults). Only cookie names are overridden —
  cookie options continue to come from Auth.js defaults via its config
  merge. The schema gains an optional `auth.advanced.cookiePrefix` string.

- **Automatic port selection.** The CLI now finds the next available port
  instead of erroring when the requested port is in use, warning which port
  it landed on.

- **Auth URL mismatch warning.** Auth.js derives the app origin from
  request headers (`trustHost`), so an unset `AUTH_URL` already works on
  whatever port the dev server lands on. When `AUTH_URL` (or the v4
  fallback `NEXTAUTH_URL`) is pinned to a different port, the dev server
  warns that sign-in callbacks and redirects will target the pinned URL.

Set the same `cookiePrefix` on two apps to intentionally share an auth
session in dev.
