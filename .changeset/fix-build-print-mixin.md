---
'@lowdefy/server': patch
---

fix(server): Remove unused print mixin from build logger

Removed the pino `mixin` that added a `print` field to every build log entry. This field was a leftover from a previous CLI display system and caused spurious `print: warn` lines in build output.
