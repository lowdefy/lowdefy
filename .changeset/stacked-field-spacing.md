---
'@lowdefy/blocks-antd': major
'@lowdefy/codemods': minor
---

feat(blocks-antd)!: Stacked fields carry their own spacing

An input with its label above it now keeps 16px below itself (4px for `size: small`), so a form needs no `layout.gap` between its fields, and a small label sits 2px above its input instead of touching it. Inputs with an inline label or no label keep no spacing, so filter bars and toolbars are unchanged. A container tunes the spacing for the fields inside it with the `--lf-field-gap` and `--lf-field-gap-small` CSS variables in its `style`.

Forms that spaced their fields with `layout.gap` now get the gap plus the field's own space. To migrate an app, run `lowdefy upgrade`. Its Lowdefy 8 step, `field-spacing`, removes the vertical gap from form containers, keeps the horizontal gap for fields side by side (`gap: 16` becomes `gap: [16, 0]`), and reports containers it cannot judge. To migrate by hand, remove the vertical gap from each container of stacked fields.
