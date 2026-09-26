---
'@lowdefy/server-dev': patch
---

fix(server-dev): Rebuild the config on any change while the last build failed.

The dev server decides whether an edit needs a config rebuild from the list of files the last successful build read. A file that only the failed build read, such as a new endpoint file whose error you are fixing, was not on that list, so fixing it only reloaded pages and the build status kept reporting the fixed error until `lowdefy.yaml` was touched. While the last config build failed, every change now rebuilds the config.
