---
'@lowdefy/build': patch
---

fix(build): Report all ref errors at once instead of stopping on the first one.

When multiple referenced files have errors (missing files, YAML parse errors, invalid refs), the build now collects and reports all errors at once instead of stopping on the first failure. This reduces the fix-rebuild-fix cycle when multiple config files have issues.
