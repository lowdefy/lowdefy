---
'@lowdefy/server': patch
---

fix(server): Resolve workspace ranges when writing package.original.json

`package.original.json` is what the CLI restores over a consuming app's generated
server, but it was copied from package.json before pnpm rewrites `workspace:`
protocols at publish - so a `workspace:*` dependency reached every consumer as a
range no registry can resolve, and `lowdefy build` failed to install. The file is
now generated with workspace ranges resolved to the fixed workspace version.
