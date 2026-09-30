---
'lowdefy': patch
---

fix(cli): Server-side Sentry now runs on Vercel. The function entry that `lowdefy vercel-output` generates imported the app without initialising Sentry, so with `SENTRY_DSN` set every server error was logged but never reached Sentry; only browser errors did. The entry now initialises Sentry the same way the Node server does, before the app loads and following the `logger.sentry` settings (`server: false`, `environment`, `tracesSampleRate`), and logs `Sentry enabled: server` on a cold start. After each response it hands the flush of queued events to Vercel's `waitUntil`, which keeps the function alive until they are sent without delaying the response. Without `SENTRY_DSN` nothing changes. Redeploy to pick it up; the function entry is regenerated on every build.
