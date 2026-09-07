---
'@lowdefy/server-dev': patch
---

fix: Resolve list item block ids to their `$` config source

Blocks inside lists render with array indices applied to their ids (`my_list.0.name`) while config — and the build keyMap — hold the `$` placeholder form (`my_list.$.name`). Config lookups for these ids missed, so Option/Alt+click open-in-editor, annotation location resolution, and the `lowdefy_find_config` tool fell back to the nearest configured ancestor — usually the list block itself. `findConfig` now folds runtime indices back to `$` when the exact id misses, so list content resolves to the yaml that defines the item block.
