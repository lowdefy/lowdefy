---
'@lowdefy/api': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

Auth trusts only the request's own origin when the base URL is not pinned.

- **When neither `BETTER_AUTH_URL` nor the current environment's `url` is set**, auth now leaves BetterAuth's `baseURL` unset instead of passing a host wildcard. Password-reset, magic-link and verification links are still built from the request host, as before. The origins auth trusts, for its CSRF check and for `callbackURL`, `redirectTo`, `errorCallbackURL` and `newUserCallbackURL`, are now only the origin the request arrived on, where any host was trusted before.
- **Behind a proxy that terminates TLS and forwards plain `http`** (a self-hosted or Docker deployment, not Vercel), the request arrives on `http://`, so sign-in from the `https://` page is refused unless the URL is pinned. Set `BETTER_AUTH_URL`, or the current environment's `url` in `config.environments`, to the app's canonical origin. Pinning it remains the recommended setup for every production deployment.
