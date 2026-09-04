---
'@lowdefy/build': patch
---

A `_build.env` read of a variable the build environment does not set, with no `default`, now warns on every build, not only under `lowdefy check`. The value is inlined into the artifact at build time, so an unset variable was silently frozen as `null`; the warning fires where the value is inlined and names the operator's config location. `_secret` reads stay check-only, since they resolve where the app runs.
