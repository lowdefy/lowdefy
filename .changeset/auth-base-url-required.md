---
'@lowdefy/api': major
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

Production refuses to start when auth emails links and its base URL is not pinned.

- **Breaking:** with `auth.email` configured, a production server (`lowdefy start`, a Docker or Node deployment, Vercel) now fails at startup with a `ConfigError` unless `BETTER_AUTH_URL`, or the `url` of the current environment in `config.environments`, is set. Every emailed auth flow — email verification, password reset, magic link and invitations — builds its links from this origin; without it they would take their host from the incoming request. The error names the flows the app sends. To test the production server locally, set `BETTER_AUTH_URL=http://localhost:3000`.
- Apps without `auth.email` still start with an unpinned origin, and log a warning.
- The dev server (`lowdefy dev`) is unchanged: it keeps using the request origin.
