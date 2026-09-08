#!/usr/bin/env bash
#
# Vercel install step for the Lowdefy docs app, deployed from this monorepo.
#
# Unlike a standalone Lowdefy app (which downloads a published server with `npx lowdefy@<version>`),
# the docs app is built against the workspace: `lowdefy: local` in packages/docs/lowdefy.yaml uses
# the server and plugins in this repo directly, via `--server-directory`. That is why the deploy runs
# from the repo root and installs the whole workspace here.
#
# Vercel project settings:
#   - Root Directory: packages/servers/server
#   - "Include files outside the root directory in the Build Step": ON
#   - Install Command: bash vercel.install.docs.sh
#   - Build Command:   bash vercel.build.docs.sh
set -euo pipefail

# This script runs from the Root Directory (packages/servers/server); step up to the repo root.
cd ../../..

pnpm install --frozen-lockfile
