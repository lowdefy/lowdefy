---
'lowdefy': patch
'@lowdefy/docs': patch
---

`lowdefy dev` now checks that the npm dependencies your file plugins import are actually installed in the config directory before it starts the server. In development a file plugin is loaded from where you wrote it, so its bare imports resolve against the app's own `node_modules`; merging those dependencies into the server, which is what a production build needs, does nothing for dev. Previously a missing package surfaced later as a cryptic `Cannot find module` from inside Vite, cached until the dev server was restarted; now the dev command stops immediately, naming every missing package and the directory to install it in. The file-plugin documentation states the dependency contract in full: declare the package once in the app's `package.json`, install it in the app for development, and the build installs the same dependencies into the server for production, where `devDependencies` are never merged and a name the server already pins keeps the server's version.
