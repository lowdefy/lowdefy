---
'@lowdefy/build': patch
---

fix(build): `_var` and `_module.var` errors name the line that holds them

A `_var` with a reserved key or an invalid argument, and a `_module.var` whose argument is not a string, failed the build with the file name only. These errors now give `file:line`, at the key that holds the operator, in the terminal and in the dev server's build status.
