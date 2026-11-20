---
'@lowdefy/build': patch
---

Ship the schemas of the default Lowdefy plugins with the build, so a default plugin is schema-checked in the first build whether or not it is installed yet. `lowdefy build` and the dev server no longer build twice to check default plugins.
