---
'@lowdefy/server': patch
'@lowdefy/connection-mongodb': patch
---

fix: Lowdefy apps no longer install Next.js.

The production server still listed `@sentry/nextjs`, and the MongoDB connection still listed `@next-auth/mongodb-adapter`. Neither was used: Sentry already runs on `@sentry/node`, `@sentry/browser` and `@sentry/vite-plugin`, and the MongoDB auth adapter is built on BetterAuth. `@sentry/nextjs` requires Next.js as a peer, and `@next-auth/mongodb-adapter` requires `next-auth`, which requires Next.js, so every app installed Next.js (and `next-auth` with the MongoDB connection) for nothing. They are removed, along with the unused Next.js lint plugin. Sentry setup and configuration are unchanged.
