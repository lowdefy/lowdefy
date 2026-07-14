---
'@lowdefy/blocks-antd': minor
---

feat(blocks-antd): Add the `TagSelector` input block.

`TagSelector` is a multi-select input rendered as a row of toggleable tag pills, wrapped in the standard input label. Its value is the array of selected option values, and it fires `onChange` on every toggle.

- `options` accept primitives or `{ label, value, color, disabled }`.
- Each option gets a stable color (an explicit `color` wins, otherwise a color is picked from a fixed palette based on the option's value), so a given value keeps the same hue on every render. Selected pills are filled with auto-contrast text; unselected pills are outlined with a hint of their color.
- Set `colored: false` for single-accent pills that use the primary color.
- Supports `title`, `label`, `size`, and `disabled` like the other selector blocks, plus per-option `disabled`.
