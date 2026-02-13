#!/bin/bash
# Run a Lowdefy app in dev mode.
#
# Usage:
#   pnpm app:dev                          # runs the default app/ directory
#   pnpm app:dev -- --path <path>         # runs a specific app directory
#
# <path> is relative to the repo root, e.g.:
#   pnpm app:dev -- --path packages/build/src/tests/errors/C2-menu-missing-page

CONFIG_PATH="app"

while [[ $# -gt 0 ]]; do
  case $1 in
    --path)
      CONFIG_PATH="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

# The CLI runs from packages/cli/, so config-directory needs ../../ prefix
RELATIVE_CONFIG="../../${CONFIG_PATH}"

pnpm build:turbo && pnpm -r --filter=lowdefy start dev --config-directory "$RELATIVE_CONFIG" --dev-directory ../servers/server-dev
