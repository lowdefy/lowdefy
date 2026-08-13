---
'@lowdefy/blocks-antd': minor
---

feat(blocks-antd): Add `columns` and `gutter` to `CheckboxSelector` and `RadioSelector`.

A long list of options flowed across the row and wrapped wherever the labels happened to run out of room, so it could not be read down a column. The only even alternative was `direction: vertical` — one option per line — which does not scale past a handful of options.

Set `columns` to lay the options out in an even grid instead: `columns: 2` gives two equal-width columns. Use a count that divides 24 evenly (1, 2, 3, 4, 6, 8 or 12), or a responsive breakpoint object such as `{ xs: 1, md: 3 }`. `gutter` sets the spacing between options, as a number or a `[horizontal, vertical]` pair, and defaults to matching the spacing the flowed layout produced.

`align`, `direction` and `wrap` describe the flowed layout and are ignored while `columns` is set. With `columns` unset, both blocks render exactly as before.

The `theme.marginXS` description on `CheckboxSelector` is also corrected — it claimed to be the horizontal gap between checkboxes, which was never what that token affected.
