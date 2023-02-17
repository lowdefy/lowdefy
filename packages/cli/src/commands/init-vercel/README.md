# Vercel Deployment

To deploy a Lowdefy app on Vercel a custom install script needs to run to download the server and build the Lowdefy configuration. This script creates a Next.js application that can then be built by Vercel. The install script needs to be placed in an empty directory and it installs the server in its working directory - by default this directory is called `deploy`.

The script can be created using the `init-vercel` CLI command, or the following file can be created at `<config-directory>/deploy/vercel.install.sh`:

###### vercel.install.sh

```bash
# Read Lowdefy version from lowdefy.yaml using sed
LOWDEFY_VERSION=$(sed -nE "s/lowdefy:(.*)/\1/p" ../lowdefy.yaml)
# Substitution params are to trim whitespace from the LOWDEFY_VERSION var
npx lowdefy@${LOWDEFY_VERSION//[[:space:]]/} build --config-directory ../  --server-directory . --no-next-build --log-level=debug
```

To deploy a Lowdefy app on Vercel:

- Create a new project
- Connect the GitHub, Gitlab or BitBucket repository with your Lowdefy app to the Vercel project
- The framework preset should be Next.js
- The root directory should be `<config-directory>/deploy`
  - `<config-directory>` is the path to the directory in which the `lowdefy.yaml` file is placed
  - Eg: If the `lowdefy.yaml` is in the top level of the repository the configured root directory should be `deploy`
  - Eg: If the `lowdefy.yaml` is in the directory `apps/app_name` the configured root directory should be `apps/app_name/deploy`
- The build command should be `pnpm next build`
- The install command should be `sh vercel.install.sh`

Secrets can be set in the Environment Variables settings section by creating environment variables prefixed with `LOWDEFY_SECRET_`. Different secrets can be set for production and preview deployments.

All other Vercel configuration like domain names, preview deploy branches, serverless regions and redirects can be configured as desired.
