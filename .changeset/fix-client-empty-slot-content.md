---
'@lowdefy/client': patch
---

fix(client): Skip rendering content slots that have no blocks.

`Container`, `InputContainer`, and `List` no longer create a `content[slotKey]` function when the slot's blocks array is empty. Blocks that use the `content.X && content.X()` pattern (for optional header, footer, extra, etc.) now correctly render nothing — including no wrapping `Area` element — when the user leaves the slot empty.
