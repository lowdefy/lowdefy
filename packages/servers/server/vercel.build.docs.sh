#!/usr/bin/env bash
#
# Vercel build step for the Lowdefy docs app, deployed from this monorepo.
#
# Builds the workspace, then the docs app's config + Hono server + Vite client against the real
# @lowdefy/server package, and finally assembles the Vercel Build Output. Because the server is a
# workspace member, `lowdefy vercel-output` traces the function against the repo root (where
# pnpm-workspace.yaml lives), so the linked @lowdefy/* files in node_modules/.pnpm are all in scope.
#
# The Build Output lands in packages/servers/server/.vercel/output — i.e. inside the Root Directory —
# where Vercel picks it up automatically (no Output Directory setting).
set -euo pipefail

# This script runs from the Root Directory (packages/servers/server); step up to the repo root.
cd ../../..

# The Lowdefy CLI is the workspace `lowdefy` package. Run it with `node` from the repo root (not
# `pnpm --filter lowdefy`, which would change the working directory and break the relative
# --config-directory/--server-directory paths). Its dist is built by step 1.
CLI="node packages/cli/dist/index.js"

# 1. Build every @lowdefy/* workspace package (dist/) so the CLI and server resolve local code.
pnpm build

# 2. Build the docs app config + server artifacts into the server package (client build runs next).
$CLI build \
  --config-directory packages/docs \
  --server-directory packages/servers/server \
  --no-client-build \
  --log-level debug

# 3. Build the Vite client into packages/servers/server/dist/client.
pnpm --filter @lowdefy/server run build:client

# 4. Assemble the Vercel Build Output (.vercel/output) inside the server package.
$CLI vercel-output \
  --config-directory packages/docs \
  --server-directory packages/servers/server \
  --log-level debug
