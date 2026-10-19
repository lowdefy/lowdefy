---
'@lowdefy/build': patch
---

fix: A plugin package without a `schemas` (or other optional) subpath no longer fails the build.

Node reports a subpath missing from a package's `exports` as `ERR_PACKAGE_PATH_NOT_EXPORTED`, which the plugin module importer treated as a broken module rather than the expected miss — so an app using a plugin that ships actions but no schemas (e.g. `@lowdefy/community-plugin-xlsx`) could not build.
