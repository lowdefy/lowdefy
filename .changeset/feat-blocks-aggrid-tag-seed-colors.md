---
'@lowdefy/blocks-aggrid': minor
---

feat(blocks-aggrid): Auto-colour tag cells by default for consistent per-value colouring.

When a `cell.type: tag` column is used with no `colorMap`, no `colorFrom`, and no `default`, tag values are now coloured from a stable hash so the same value always gets the same colour across rows, columns, and tables. The palette uses 12 antd named hues (red, volcano, orange, gold, yellow, lime, green, cyan, blue, geekblue, purple, magenta) and respects the active theme.

The grey fallback is still available — set `cell: { type: tag, default: default }` on any column to opt out. When `colorMap`, `colorFrom`, or `default` is set, behaviour is unchanged.
