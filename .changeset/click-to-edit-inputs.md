---
'@lowdefy/blocks-antd': minor
---

feat(blocks-antd): Inputs for click-to-edit fields

A field that shows its input only after the value is clicked can now be edited in one click:

- `autoOpen` on Selector, MultipleSelector and DateSelector opens the dropdown (or calendar) and focuses the block when it mounts.
- `selectOnFocus` on TextInput and NumberInput selects the text when the input gets focus, `autoFocus` included, so typing replaces it.
- An `onEscape` event on TextInput and NumberInput fires with `{ value }`, the current value, when Escape is pressed, so a page can cancel the edit and restore the value it kept.
