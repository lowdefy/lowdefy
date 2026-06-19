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
  config is unchanged (NextAuth defaults). The schema gains an optional
  `auth.advanced.cookiePrefix` string.

- **Automatic port selection.** The CLI now finds the next available port
  instead of erroring when the requested port is in use, warning which port
  it landed on.

- **NEXTAUTH_URL reconciliation.** The dev server defaults an unset
  `NEXTAUTH_URL` to match the port it actually bound to, so OAuth callbacks
  and sign-in redirects target the right origin. A pinned `NEXTAUTH_URL` on
  a mismatched port is left untouched but warned about.

Set the same `cookiePrefix` on two apps to intentionally share an auth
session in dev.
