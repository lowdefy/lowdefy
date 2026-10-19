---
'lowdefy': patch
---

fix(cli): `lowdefy vercel-output` honours `config.basePath`. The static client was placed at the root of the deployment while its HTML asks for `<basePath>/assets/*`, so an app with a base path served no scripts, styles or public files on Vercel. Static files are now placed under the base path, the immutable cache route for hashed assets matches under it, and the generated cron jobs call `<basePath>/api/cron/*`, where the app mounts its routes.
