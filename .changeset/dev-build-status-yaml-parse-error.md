---
'@lowdefy/server-dev': patch
---

fix(server-dev): A `lowdefy.yaml` with a YAML syntax error no longer leaves the build status at the last build's `ok`. The config watcher skipped the build when it could not read the Lowdefy version from the file, and reading the plugin list from `lowdefy.yaml` ran outside the part of the build that reports errors. The build now runs and `lowdefy_build_status` returns the parse error.
