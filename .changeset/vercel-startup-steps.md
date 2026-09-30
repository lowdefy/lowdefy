---
'lowdefy': patch
'@lowdefy/server': patch
---

fix(server,cli): The Vercel function now starts the same way as the Node server. Two startup steps only ran on the Node server:

- **`NEXTAUTH_URL`**: it is aliased to `AUTH_URL` on Vercel too. Before, a Vercel app that set only `NEXTAUTH_URL` built its auth links (sign-in callbacks, OAuth redirects, email links) from whichever host the request came in on, not from `NEXTAUTH_URL`. The environment `url` default was skipped as well.
- **Environment guards**: `config.environments.<name>.guards` are now checked again when a Vercel function starts, as the docs already said. A deployment whose runtime variables differ from the build's, for example one built with `vercel build` and deployed with `--prebuilt` or `--env`, now fails every request with the guard error instead of serving with the wrong variables.

Both entries now share one startup module (`src/initServer.js` in the server), so they stay in step.
