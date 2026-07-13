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
