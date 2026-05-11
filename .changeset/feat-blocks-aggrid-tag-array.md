---
'@lowdefy/blocks-aggrid': minor
---

feat(blocks-aggrid): Tag cell renders one tag per item for array-valued fields.

The `cell.type: tag` renderer now accepts an array of strings in addition to a single string. Each item is rendered as its own styled tag and resolves its colour through the existing `colorMap` / `colorFrom` / `default` configuration. Empty arrays and arrays containing only null/empty entries render the em-dash placeholder, matching the existing null-value behaviour. Single-string values are unchanged.
