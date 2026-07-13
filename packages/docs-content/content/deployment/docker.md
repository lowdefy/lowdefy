# Deploy with Docker

### Building a Lowdefy app image

A Lowdefy app can be self-hosted or deployed to any hosting provider that runs Docker containers. The image contains the built app configuration, the [Hono](https://hono.dev) server, and the built client assets — a self-contained Node.js server with no external build steps at runtime.

Run the `init-docker` CLI command in your project to create a `Dockerfile` and `.dockerignore`:

```
pnpx lowdefy@6 init-docker
```

The generated Dockerfile:

```text
# syntax=docker/dockerfile:1

FROM node:22-slim AS builder

WORKDIR /lowdefy

# pnpm is required by the Lowdefy build to install server dependencies. Installed
# through npm rather than corepack — corepack is not bundled from Node.js 25.
RUN npm install --global pnpm@10

# pnpm stores packages in $PNPM_HOME/store — mounted as a BuildKit cache below so
# repeat builds only download new or changed packages.
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME/bin:$PATH"

COPY . .

# Build the Lowdefy app (config build + Vite client build), pinning the CLI to the
# `lowdefy:` version in lowdefy.yaml so builds are reproducible.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  LOWDEFY_VERSION=$(sed -nE "s/^lowdefy:(.*)/\1/p" lowdefy.yaml lowdefy.yml 2>/dev/null | tr -d '[:space:]') \
  && test -n "$LOWDEFY_VERSION" || { echo "Could not read the lowdefy version from lowdefy.yaml"; exit 1; } \
  && npx lowdefy@"$LOWDEFY_VERSION" build

# The build installs devDependencies (the build itself needs them) — remove them so
# only runtime dependencies are copied into the final image.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  cd .lowdefy/server && pnpm prune --prod

FROM node:22-slim AS runner

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /lowdefy

# The node user (uid 1000) ships with the official Node.js images.
COPY --from=builder --chown=node:node /lowdefy/.lowdefy/server ./

USER node

EXPOSE 3000

# The Lowdefy server serves a liveness endpoint at /api/lowdefy-health. If your app sets a
# basePath, prepend it to the path below. Orchestrators with their own probes
# (e.g. Kubernetes) ignore this and should point their probes at the same path.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://localhost:'+(process.env.PORT||3000)+'/api/lowdefy-health').then((res)=>process.exit(res.ok?0:1)).catch(()=>process.exit(1))"]

# Exec form keeps node as PID 1 — src/index.js handles SIGTERM/SIGINT for
# graceful shutdown, so no init wrapper is needed.
CMD ["node", "src/index.js"]
```

with a `.dockerignore` file:

```
.git
.lowdefy
.env
.env.*
node_modules
Dockerfile
.dockerignore
README.md
```

Build and run the image:

```
docker build -t my-lowdefy-app .
docker run -p 3000:3000 my-lowdefy-app
```

Key properties of this setup:

- **Reproducible builds**: the CLI version is read from the `lowdefy:` field in `lowdefy.yaml`, so the image always builds with the same Lowdefy version as your app config, and rebuilding an old commit produces the same server.
- **Fast rebuilds**: the pnpm store is kept in a BuildKit cache mount, so changing app config only re-downloads dependencies that actually changed.
- **Small runtime image**: build-only dependencies (Vite, the Lowdefy build package, and other devDependencies) are pruned before the server is copied into the `node:22-slim` runtime stage.
- **Non-root**: the server runs as the `node` user built into the official Node.js images.
- For stronger supply-chain guarantees, pin the base images by digest (`node:22-slim@sha256:...`) and let a bot like Renovate or Dependabot keep the digest updated.

### Health checks

The Lowdefy server serves `GET /api/lowdefy-health`, which responds `200` with `{"status":"ok"}`. The endpoint skips authentication, session lookup, and request logging, so frequent probes do not pollute logs or create sessions.

The Dockerfile `HEALTHCHECK` uses this endpoint, which makes `docker ps` and Docker Compose report container health. Kubernetes ignores the Dockerfile `HEALTHCHECK` — point liveness and readiness probes at `/api/lowdefy-health` instead:

```yaml
livenessProbe:
  httpGet:
    path: /api/lowdefy-health
    port: 3000
readinessProbe:
  httpGet:
    path: /api/lowdefy-health
    port: 3000
```

If your app configures a `basePath`, the endpoint is served at `{basePath}/api/lowdefy-health`.

### Environment variables and secrets

The server is configured entirely through environment variables at runtime — the image itself contains no secrets:

| Variable            | Purpose                                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| `PORT`              | Port the server listens on (default `3000`).                             |
| `LOWDEFY_SECRET_*`  | App secrets, accessed with the [`_secret`](/_secret) operator.           |
| `AUTH_SECRET`       | Required when using [Lowdefy Auth](/users-introduction).                 |
| `AUTH_URL`          | The deployed app URL, required for OAuth providers.                      |
| `CRON_SECRET`       | Bearer token protecting `/api/cron/*` and `/api/detached/*` endpoints.   |
| `LOWDEFY_LOG_LEVEL` | Server log level: `debug`, `info` (default), `warn`, `error`.            |
| `SENTRY_DSN`        | Enables Sentry error reporting when set.                                 |

In production, use your hosting provider's secret manager to inject these — never bake them into the image. When running locally, pass a `.env` file:

```
docker run -p 3000:3000 --env-file ./.env my-lowdefy-app
```

The `.dockerignore` excludes `.env` from the build context on purpose, so secrets cannot leak into image layers. If your build needs a secret (for example `SENTRY_AUTH_TOKEN` to upload source maps), use a BuildKit secret mount instead of a build argument — build arguments are recorded in the image history:

```
docker build --secret id=sentry,env=SENTRY_AUTH_TOKEN .
```

and in the Dockerfile:

```text
RUN --mount=type=secret,id=sentry,env=SENTRY_AUTH_TOKEN \
  npx lowdefy@"$LOWDEFY_VERSION" build
```

### Logging

The server writes structured JSON logs (one JSON object per line, via [pino](https://getpino.io)) to stdout — the format container platforms and log collectors (CloudWatch, Loki, Datadog, etc.) expect. Nothing is written to files inside the container.

Control verbosity with `LOWDEFY_LOG_LEVEL`. To read logs as human-friendly output during local development, pipe them through `pino-pretty`:

```
docker logs -f my-container 2>&1 | npx pino-pretty
```

### Graceful shutdown

On `SIGTERM` (sent by `docker stop`, Compose, and Kubernetes) the server stops accepting new connections, closes websocket clients with code `1001` (clients reconnect and resubscribe automatically), finishes in-flight requests, flushes pending Sentry events, and exits — within Docker's default 10 second stop grace period. No `--init` flag or init wrapper is required.

### Scheduled endpoints

Unlike [Vercel deployments](/vercel), a Docker container has no built-in scheduler for API endpoint `schedules`. Trigger scheduled endpoints from an external scheduler — a host crontab, a Kubernetes CronJob, or your platform's scheduled tasks — by calling the cron route with the `CRON_SECRET` bearer token:

```
curl -H "Authorization: Bearer $CRON_SECRET" https://my-app.example.com/api/cron/my-endpoint-id
```

### Docker Compose

```yaml
services:
  lowdefy:
    build: .
    ports:
      - '3000:3000'
    env_file: ./.env
    restart: unless-stopped
```

The container inherits the Dockerfile `HEALTHCHECK`, so `docker compose ps` reports health. Build and run with:

```
docker compose up --build
```

If you set a container memory limit, Node.js 22+ sizes its heap from the container's cgroup limit automatically. To control it explicitly, set `NODE_OPTIONS=--max-old-space-size=<MiB>` a comfortable margin below the container limit.

### Config files or plugins outside the config directory

Only files inside the Docker build context (the directory containing the Dockerfile) can be accessed during the build.

Sometimes files outside of the config directory need to be accessed by the Lowdefy app during build - for example using the `_ref` operator on shared config files, or when using pnpm local workspace plugins. In this case, move the Dockerfile up to a directory that contains everything the build needs, and point the build at the config directory:

```text
# syntax=docker/dockerfile:1

FROM node:22-slim AS builder

WORKDIR /lowdefy

RUN npm install --global pnpm@10

ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME/bin:$PATH"

COPY . .

# TODO: Change the config directory (./app) as appropriate here
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  LOWDEFY_VERSION=$(sed -nE "s/^lowdefy:(.*)/\1/p" app/lowdefy.yaml app/lowdefy.yml 2>/dev/null | tr -d '[:space:]') \
  && test -n "$LOWDEFY_VERSION" || { echo "Could not read the lowdefy version from lowdefy.yaml"; exit 1; } \
  && npx lowdefy@"$LOWDEFY_VERSION" build --config-directory ./app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  cd app/.lowdefy/server && pnpm prune --prod

FROM node:22-slim AS runner

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /lowdefy

# TODO: Change the from directory (/lowdefy/app/.lowdefy/server) as appropriate here
COPY --from=builder --chown=node:node /lowdefy/app/.lowdefy/server ./

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://localhost:'+(process.env.PORT||3000)+'/api/lowdefy-health').then((res)=>process.exit(res.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "src/index.js"]
```

Note that local workspace plugins referenced with relative `file:` or `link:` paths must resolve from inside `.lowdefy/server` within the build context — paths that reach outside the context will fail to install.
