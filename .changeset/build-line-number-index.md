---
'@lowdefy/build': patch
---

perf(build): Config builds no longer slow down with large YAML files

The build stamps every YAML node with its line number so errors can point at the defining line. It counted the newlines before each node by copying the file up to that node, so a file's cost grew with its size times its node count, and that took about a fifth of a large app's config build. Each file's newline offsets are now collected once, and every node's line is a binary search over them. Line numbers are unchanged.
