---
'@lowdefy/build': patch
'@lowdefy/errors': patch
---

A `_build.env` read of a variable the build environment does not set, with no `default`, now warns on every build. The value is inlined into the artifact at build time, so an unset variable was silently frozen as `null`; the warning fires where the value is inlined and names the operator's config location. The warning carries the `secrets` check slug, so it can be suppressed with `~ignoreBuildChecks`.
