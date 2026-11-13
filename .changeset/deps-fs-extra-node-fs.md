---
'@lowdefy/node-utils': patch
---

chore(deps): Replace fs-extra with node:fs in node-utils

`cleanDirectory` and `copyFileOrDirectory` use `node:fs/promises`, and `fs-extra` is no longer a dependency of `@lowdefy/node-utils`.

`cleanDirectory` empties the directory in place, as `fs-extra`'s `emptyDir` did, and creates it when it is missing. It does not remove and recreate the directory: the dev server's watchers watch the build directory itself, which a rebuild cleans, and a watch on a removed directory is not guaranteed to follow its replacement.

`copyFileOrDirectory` uses `fs.cp` with `recursive` and `verbatimSymlinks`, so a relative symlink is copied as the same relative link, as `fs-extra` copied it; `fs.cp` otherwise rewrites it to an absolute path into the source tree. Its optional third argument is now passed to `fs.cp` rather than `fs-extra`'s `copy`. No Lowdefy caller passes one.
