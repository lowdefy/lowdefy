---
'@lowdefy/server-dev': patch
---

fix(server-dev): Serve development builds of client dependencies whatever NODE_ENV is set

The dev server pre-bundles client dependencies (React, antd and the libraries under them) with `process.env.NODE_ENV` taken from the shell that started it, while the app's own code always got `development`. A dev server started with `NODE_ENV=test` (for example from a test runner's setup) or `NODE_ENV=production` served the dependencies built for that environment instead. Under `NODE_ENV=test`, antd's components moved their layout effects to passive effects, so a Button whose onClick action had just finished ignored a click that came within a few milliseconds, before its loading state cleared. The dependencies are now always built for development, like the app's code.
