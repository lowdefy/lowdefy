# Read Lowdefy version from lowdefy.yaml using sed
LOWDEFY_VERSION=$(sed -nE "s/lowdefy:(.*)/\1/p" ../lowdefy.yaml)
# Substitution params are to trim whitespace from the LOWDEFY_VERSION var.
# Writes the Hono server into this directory; the client is built separately by the
# Vercel build command (`pnpm run build:client`, set in vercel.json).
npx lowdefy@${LOWDEFY_VERSION//[[:space:]]/} build --config-directory ../  --server-directory . --no-client-build --log-level=debug
