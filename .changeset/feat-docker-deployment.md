---
'@lowdefy/server': minor
'lowdefy': minor
---

feat: Production-grade Docker deployment.

**Health endpoint (`@lowdefy/server`)**

- The server now serves `GET /api/lowdefy-health` for container health checks and orchestrator probes. The endpoint skips auth, session lookup, request logging, and Sentry, so frequent probes stay out of logs.

**Container-friendly startup and shutdown (`@lowdefy/server`)**

- Startup and Sentry-enabled messages now log as structured JSON through pino instead of plain text, keeping stdout a uniform NDJSON stream for log collectors.
- On SIGTERM/SIGINT the server closes websocket clients (code 1001, clients reconnect automatically), finishes in-flight requests, flushes pending Sentry events, and exits well within Docker's 10 second stop grace period.

**New `docker-output` CLI command (`lowdefy` CLI)**

- Assembles a minimal production runtime at `.lowdefy/docker` from a built app by tracing the server's runtime dependency graph (via `@vercel/nft`) and copying only the files the server imports. This drops the client-side block packages (already compiled into `dist/client`) and other unused dependencies from the image, cutting the shipped runtime to a fraction of the installed `node_modules`. Preserves pnpm workspace links so it works in monorepos.

**Rewritten `init-docker` Dockerfile (`lowdefy` CLI)**

- Pins the Lowdefy CLI to the app's `lowdefy:` version from `lowdefy.yaml`, so image builds are reproducible.
- Runs `docker-output` after the build and copies the traced runtime into the image, so build tooling (Vite, `@lowdefy/build`, webpack) and unused runtime dependencies no longer ship in production.
- Uses a BuildKit cache mount for the pnpm store, installs pnpm without corepack (removed from Node.js 25+), runs as the built-in non-root `node` user on `node:22-slim`, and adds a `HEALTHCHECK` against `/api/lowdefy-health`.
- Fixed `init-docker` failing to write `.dockerignore` from the published package.
