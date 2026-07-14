---
'@lowdefy/blocks-antd': minor
---

feat(blocks-antd): Add the `TagSelector` and `TagMultipleSelector` input blocks.

Two input blocks rendered as a row of toggleable tag pills, wrapped in the standard input label. They share the same pill rendering and stable per-value coloring, and differ only in value semantics.

- `TagSelector` is single-select: its value is one option value. Clicking a pill selects it; clicking the selected pill clears the value (sets it to `null`).
- `TagMultipleSelector` is multi-select: its value is the array of selected option values, and toggling a pill adds or removes it.
- Both fire `onChange` on every change, and accept `options` as primitives or `{ label, value, color, disabled }`.
- Each option gets a stable color (an explicit `color` wins, otherwise a color is picked from a fixed palette based on the option's value), so a given value keeps the same hue on every render. Selected pills are filled with auto-contrast text; unselected pills are outlined with a hint of their color.
- Set `colored: false` for single-accent pills that use the primary color.
- Both support `title`, `label`, `size`, and `disabled` like the other selector blocks, plus per-option `disabled`.
