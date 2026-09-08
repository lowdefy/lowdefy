# Read Lowdefy version from lowdefy.yaml using sed
LOWDEFY_VERSION=$(sed -nE "s/lowdefy:(.*)/\1/p" ../lowdefy.yaml)
# Substitution params are to trim whitespace from the LOWDEFY_VERSION var.
# Writes the Hono server and config artifacts into this directory. The client build and the Vercel
# Build Output assembly run separately in the build step (vercel.build.sh).
npx lowdefy@${LOWDEFY_VERSION//[[:space:]]/} build --config-directory ../  --server-directory . --no-client-build --log-level=debug
