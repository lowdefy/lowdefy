---
'lowdefy': patch
'@lowdefy/server': patch
'@lowdefy/build': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

fix(server,cli): The Vercel function now starts the same way as the Node server. The function entry that `lowdefy vercel-output` generates skipped two startup steps that only ran on the Node server:

- **Sentry**: server-side Sentry now runs on Vercel. Before, with `SENTRY_DSN` set every server error was logged but never reached Sentry; only browser errors did. Sentry is initialised before the app loads, follows the `logger.sentry` settings (`server: false`, `environment`, `tracesSampleRate`), and logs `Sentry enabled: server` on a cold start. On Vercel it reports errors only, with Sentry's light SDK (`@sentry/node-core/light`: no tracing, OpenTelemetry set-up or module loader hooks, which would add about 300 ms and 130 MB to each cold start), and with client reports off. Set `logger.sentry.serverTracing: true` to trace server requests on Vercel. The flush of queued events starts once the response closes and is handed to Vercel's `waitUntil`, so a request that captured nothing ends right after its response, and one that captured an error, or whose transaction tracing sampled, waits only for that upload. Without `SENTRY_DSN` nothing changes.
- **Environment guards**: `config.environments.<name>.guards` are now checked again when a Vercel function starts, as the docs already said. A deployment whose runtime variables differ from the build's, for example one built with `vercel build` and deployed with `--prebuilt` or `--env`, now fails every request with the guard error instead of serving with the wrong variables.

Both entries now share one startup module (`src/initServer.js` in the server), so they stay in step. Redeploy to pick it up; the function entry is regenerated on every build.
