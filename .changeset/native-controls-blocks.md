---
'@lowdefy/blocks-native': minor
'@lowdefy/build': minor
'@lowdefy/shell': minor
---

feat(blocks-native): Native SegmentedControl, Sheet and Menu blocks, and Selector `variant: menu`

`@lowdefy/blocks-native` now draws the platform's own controls through `@expo/ui`, which the `basic` shell profile already links, so no native rebuild is needed.

- `SegmentedControl` is an input: a SwiftUI segmented picker on iOS and Material segmented buttons on Android. It takes `options` as a Selector does, fills its container's width, and fires `onChange` with `{ value }`.
- `Sheet` is a container presented as a native sheet: a SwiftUI sheet with medium and large detents on iOS and a Material modal bottom sheet on Android. It takes `title`, `detents` (`both`, `medium` or `large`), `dragToDismiss` and `closable`, a `content` slot and a `headerRight` slot. Its `open` and `close` methods are called with CallMethod, and it fires `onOpen` and `onClose`.
- `Menu` opens a native menu (a SwiftUI Menu, or a ContextMenu with `openOn: longPress`) from its `content` slot blocks or from an icon and title. Items take `id`, `title`, an SF Symbol `symbol`, `checked`, `destructive`, `disabled` and `hidden`; an item with `items` is a section, or a nested menu with `submenu: true`. Picking one fires `onSelect` with `{ id }`.
- Selector takes `variant: menu`: an iOS Settings-style row, the title at the left and the chosen option at the right with an up-down chevron, that opens a native menu of the options with the chosen one checked. Options can carry a `symbol`, an `icon` and `iconColor`, or an `avatar` drawn as initials.
