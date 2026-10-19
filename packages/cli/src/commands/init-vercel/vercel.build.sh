# Vercel build command. The install step (vercel.install.sh) already downloaded the Hono server and
# built the config artifacts into this directory. Here we build the Vite client, then assemble the
# Vercel Build Output (.vercel/output) — including cron jobs generated from endpoint `schedules`.
# Read Lowdefy version from lowdefy.yaml using sed.
LOWDEFY_VERSION=$(sed -nE "s/lowdefy:(.*)/\1/p" ../lowdefy.yaml)
# Substitution params are to trim whitespace from the LOWDEFY_VERSION var.
pnpm run build:client
npx lowdefy@${LOWDEFY_VERSION//[[:space:]]/} vercel-output --config-directory ../ --server-directory . --log-level=debug
