---
'lowdefy': patch
'@lowdefy/server': patch
---

fix(server,cli): The Vercel function now starts the same way as the Node server. The function entry that `lowdefy vercel-output` generates skipped two startup steps that only ran on the Node server:

- **Sentry**: server-side Sentry now runs on Vercel. Before, with `SENTRY_DSN` set every server error was logged but never reached Sentry; only browser errors did. Sentry is initialised before the app loads, follows the `logger.sentry` settings (`server: false`, `environment`, `tracesSampleRate`), and logs `Sentry enabled: server` on a cold start. After each request, including one that fails, the flush of queued events is handed to Vercel's `waitUntil`, which keeps the function alive until they are sent without delaying the response. Without `SENTRY_DSN` nothing changes.
- **Environment guards**: `config.environments.<name>.guards` are now checked again when a Vercel function starts, as the docs already said. A deployment whose runtime variables differ from the build's, for example one built with `vercel build` and deployed with `--prebuilt` or `--env`, now fails every request with the guard error instead of serving with the wrong variables.

Both entries now share one startup module (`src/initServer.js` in the server), so they stay in step. Redeploy to pick it up; the function entry is regenerated on every build.
