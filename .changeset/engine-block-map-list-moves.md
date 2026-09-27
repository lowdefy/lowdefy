---
'@lowdefy/engine': patch
---

fix(engine): list row moves and removals no longer leave stale entries in the page's block map.

Moving or removing a list row whose nested lists differed in length, or a `SetState` or `Reset`
that shortened a list, left block map entries that named a moved or removed block, which
`CallMethod` and keyboard shortcuts could reach. A `Reset` also cloned the frozen page state one
more time than it needed.
