---
'@lowdefy/build': patch
---

fix(build): One warning per unset `_build.env` variable

A `_build.env` variable the build environment does not set was warned once for every place it was read, so a variable read in many files buried the other warnings. The build now gives one warning per variable, located at its first read and listing every place it is read. The warning now also carries a `file:line` location.
