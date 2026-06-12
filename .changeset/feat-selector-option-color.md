---
'@lowdefy/blocks-antd': minor
---

feat: per-option `color` on selector options.

Object options now accept a `color`, applied when that option is selected. It falls back to the block-level color when not set, and overrides it for that option when set.

- **ButtonSelector** — the selected option uses its own color: `solid` fills the button (with auto-contrast text), `outline` colors the border/text plus a low-opacity tint.
- **CheckboxSelector** / **RadioSelector** — each selected box tick / radio dot and its label render in the option's color (multiple checked boxes can each show a different color).
- **Selector** — the whole input is colored with the selected option's color. A `variant` of `solid` fills the input (with auto-contrast text); `outlined` colors the border/text. Dropdown options are tinted.
- **MultipleSelector** — each selected value's tag/pill renders in the option's color, controlled by `variant`: `solid` → filled tags, `outlined` → outlined tags (hex colors use auto-contrast text, dark-mode safe). An explicit `tag.color` still takes precedence, and per-option tag colors no longer require `renderTags`.

`Selector` and `MultipleSelector` gain `solid` as a `variant` option (alongside the antd input variants). `CheckboxSelector`/`RadioSelector` have no variant — they only apply the per-option color.

```yaml
- id: priority
  type: ButtonSelector
  properties:
    variant: outlined
    options:
      - { label: Low, value: low, color: '#16a34a' }
      - { label: Medium, value: medium, color: '#d97706' }
      - { label: High, value: high, color: '#dc2626' }
```
