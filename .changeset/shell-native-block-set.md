---
'@lowdefy/shell': minor
---

feat(shell): Render pages with the whole native block set

The shell now registers every block of `@lowdefy/blocks-native` (the layout, display, list, input and action blocks), with the `Screen` page type from `@lowdefy/client-native`, and its type manifest lists them all, so mobile pages that use them pass the shell's type check. The shell's own placeholder `Box` is removed.
