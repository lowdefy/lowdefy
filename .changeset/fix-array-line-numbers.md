---
'@lowdefy/helpers': patch
'@lowdefy/build': patch
---

fix(helpers): Preserve ~l line numbers on arrays in serializer.copy

Fixed an issue where line number metadata (`~l`) on arrays was lost during `serializer.copy()`, causing schema validation errors to show incorrect line numbers.

**Problem:**
- Schema errors for properties like `requests:` at line 7 were showing `:1` instead of `:7`
- The `~l` property on arrays was stripped during JSON round-trip in `evaluateBuildOperators`

**Solution:**
- Arrays with `~l` are now wrapped in a marker object `{ '~arr': [...], '~l': N }` during serialization
- The reviver restores the array with `~l` preserved as a non-enumerable property
- Custom revivers now receive the restored array instead of the wrapper object

**Result:**
```
Before: lowdefy.yaml:1 at root
After:  lowdefy.yaml:7 at root
```
