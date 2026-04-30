---
'@lowdefy/operators': patch
---

fix(operators): Preserve source location on build operator results.

Build operator results (e.g. from `_build.array.concat`) now retain the source file and line number of the expression that produced them. Previously, operator evaluation replaced the expression object with a fresh result, losing the source location markers. This caused build errors inside operator-produced arrays (such as null blocks) to show the file path but no line number.
