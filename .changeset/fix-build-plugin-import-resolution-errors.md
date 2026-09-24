---
'@lowdefy/build': patch
---

fix: Any failure to resolve an optional plugin subpath is treated as an absent module, not a broken plugin.

The plugin module importer now keys on the whole family of Node ESM resolution errors (not installed, subpath missing from `exports`, a legacy package whose subpath lands on a directory, a bad exports target) rather than on `ERR_MODULE_NOT_FOUND` alone, so an older published plugin without an `exports` map (e.g. `@lowdefy/plugin-aws/connections` resolving to `dist/connections/`) no longer fails the build with `ERR_UNSUPPORTED_DIR_IMPORT`. A module that resolves but throws while loading is still reported.
