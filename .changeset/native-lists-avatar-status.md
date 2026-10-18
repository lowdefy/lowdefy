---
'@lowdefy/blocks-native': minor
'@lowdefy/build': minor
'@lowdefy/shell': minor
---

feat(blocks-native): iOS lists and rows, and the Avatar and StatusIcon blocks

- `List` takes `variant`: `insetGrouped` (the default) draws each section as a rounded group of cells, inset 16pt on the grouped background, with separators inset to the row text; `plain` draws edge to edge rows with sticky section headers. Sections come from `header` (one section) or `sectionKey` with `sections` (`[{ key, title, count, status, footer }]`, in that order, empty ones hidden). `showCount` counts each section's items, and `headerVariant` picks Footnote upper case or Headline headers.
- `ListItem` takes `leading` (a status glyph, avatar or icon) and `trailing` (text, badges, a glyph, an icon or avatars) properties and slots, a `subtitle`, `titleLines`, an iOS press highlight, `swipeActions` (`leading` and `trailing` buttons with a full swipe, firing `onSwipeAction` with the id) and `contextMenu` (iOS's native long-press menu, firing `onContextMenu` with the id). It becomes a container block for its slots.
- `Avatar` draws a person's initials on a colour picked from their name, or their image, and stacks several with `avatars`.
- `StatusIcon` draws Linear-style status, priority and stage glyphs by name, coloured for light and dark mode.
