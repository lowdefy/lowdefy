---
'lowdefy': patch
---

Fix env vars not being passed to Next.js build subprocess. The `env` object was passed as a separate parameter to `spawnProcess` instead of inside `processOptions`, so `NEXT_TELEMETRY_DISABLED` was silently ignored during `next build`.
