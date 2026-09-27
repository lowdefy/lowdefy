---
'@lowdefy/blocks-antd': minor
'@lowdefy/blocks-aggrid': patch
'@lowdefy/blocks-files': patch
---

fix: ConfigProvider `componentDisabled` now disables the Lowdefy blocks inside it.

`componentDisabled: true` on a ConfigProvider block was documented to disable every child
component, but Lowdefy's input blocks and buttons ignored it: they passed `disabled={false}` to
antd whenever the block was not loading, and antd lets an explicit `false` beat the
ConfigProvider. Blocks now pass their `disabled` property through unchanged (and `true` while
loading), so inside a ConfigProvider with `componentDisabled: true`:

- Every input, selector, date selector, switch, slider, color selector and button is disabled,
  including TagSelector and TagMultipleSelector pills, SegmentedSelector, RatingSlider,
  PhoneNumberInput, DropdownButton (its hover menu no longer opens either), the ControlledList add
  button and remove icons, and the textInput, selector, switch and buttons cells of the AgGrid
  blocks.
- A block that sets `disabled: false` itself stays enabled, and `disabled: true` still disables a
  block anywhere.
- Pasting into an UploadDragger does nothing while it is disabled by the ConfigProvider.

Nothing changes for blocks outside a ConfigProvider, or when `componentDisabled` is not set. As in
antd, ParagraphInput, TitleInput (whose `disabled` is a style only) and Pagination don't follow
`componentDisabled`.

AutoComplete now matches the other Select-based blocks:

- New `onOpenChange` event with `{ open }` when the dropdown opens or closes.
- New `listHeight`, `placement`, `popupMatchSelectWidth` and `virtual` properties, the same as
  Selector.
- `size: default` is passed to antd as `medium`, so antd 6 no longer warns about it.
- An empty `prefix` no longer falls back to `prefixIcon`, matching Selector.
