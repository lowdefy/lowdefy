---
'@lowdefy/blocks-native': minor
'@lowdefy/build': minor
'@lowdefy/client-native': minor
'@lowdefy/shell': minor
---

feat(blocks-native): ChipSelector block and the Screen `headerBottom` slot

- `ChipSelector` is a mobile-only input (`valueType: string`): a horizontally scrolling strip of 32pt chips, such as a space switcher. Options take `value`, `label`, an `icon` drawn in a 20pt rounded-square tile of the option's `color`, and a `badge`. `color` is a palette hue, token or hex colour (a tile with a white icon), or `{ fg, bg, fgDark, bgDark }`, a mark drawn fg on bg with its dark mode variants. The selected chip fills with a soft tint of its own colour, with a border and label of the colour. Chips scale as they are pressed, the strip fades at its edges and keeps the selected chip in view, and an optional `moreChip: { label, icon }` fires `onMore`. Picking a chip fires `onChange` with `{ value }`.
- `Screen` takes a `headerBottom` slot: blocks pinned directly under the header (under the large title or the search field), such as a ChipSelector and a SegmentedControl. They ride with the content as a large title collapses or the page is pulled to refresh, then stay under the header, on the screen's background with a hairline, as the page scrolls. Blocks in it sit at the 16pt screen inset; a ChipSelector runs edge to edge.
- `LowdefyPage` takes `headerInset`, where the header's bottom edge is in the page's scroll view; the shell passes the native stack's animated header height when the page scrolls under the bar, and hides the bar's own hairline for a page with a headerBottom.
- `@lowdefy/client-native` exports `EdgeInsetContext`, an area's horizontal padding that an edge-to-edge block cancels.
