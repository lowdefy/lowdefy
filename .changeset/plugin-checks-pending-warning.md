---
'@lowdefy/build': patch
'lowdefy': patch
'@lowdefy/server': patch
'@lowdefy/server-e2e': patch
'@lowdefy/server-dev': patch
---

fix: `lowdefy build` no longer warns `Plugin checks for <package> did not run: package not installed.` for plugins that have nothing to check.

A clean build warned for every plugin the server had not installed yet, including connection plugins like `@lowdefy/connection-mongodb` that ship no build check rules. The warning now names only plugins that own a block, action or operator type, and `lowdefy build` gives it only from the build after it installs the app's plugins, so it shows a plugin that is still missing rather than one it was about to install. `lowdefy dev` does the same when it starts. Journeys and dev page builds still warn for a missing block, action or operator plugin. `--skip-plugin-checks` no longer gives this warning.
