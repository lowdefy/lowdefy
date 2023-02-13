# Read Lowdefy version from lowdefy.yaml using sed
LOWDEFY_VERSION=$(sed -nE "s/lowdefy:(.*)/\1/p" ../lowdefy.yaml)
# Substitution params are to trim whitespace from the LOWDEFY_VERSION var
npx lowdefy@${LOWDEFY_VERSION//[[:space:]]/} build --config-directory ../  --server-directory . --no-next-build --log-level=debug
