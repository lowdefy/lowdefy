---
'@lowdefy/build': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

fix: Fix dev server build hang when page files contain top-level \_ref.

The dev server could hang indefinitely at "Building config..." when a page YAML file's entire content was a `_ref`. This caused a self-referencing parent in the ref map, leading to an infinite loop during page source resolution. Also fixed null `lowdefy.yaml` handling in custom plugin type map generation.
