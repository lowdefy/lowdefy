---
'@lowdefy/blocks-aggrid': minor
---

feat(blocks-aggrid): Add interactive cell inputs — `selector`, `multipleSelector`, `switch`, `textInput`, and `paragraphInput`.

The display AgGrid theme blocks (`AgGridAlpine`, `AgGridMaterial`, `AgGridBalham`) gain five new built-in `cell.type` renderers that put an input control in each row, alongside the existing `buttons` cell. They follow the same event-only model: the control is bound to the row value, and on change it fires the column's `eventName` with `{ row, value, newValue }`. The app persists the change by updating the data bound to `rowData` (e.g. a `SetState` or `Request` in the event chain); the cell also writes the new value into ag-grid's row node for immediate feedback.

- `selector` / `multipleSelector` — antd `Select` (single / multiple). Reuses the standalone `Selector`/`MultipleSelector` block option handling, so `options` (primitives or `{ label, value, disabled, color, filterString, style }`), `valueKey`, `primaryKey`, `variant` (incl. `solid` fill), colored labels and tag pills all work. Other config: `placeholder`, `allowClear`, `showSearch`, `showArrow`, `maxTagCount`, `autoClearSearchValue`, `size`, `disabled`.
- `switch` — antd `Switch`, fires on every toggle (boolean value). Config: `checkedText`, `uncheckedText`, `checkedIcon`, `uncheckedIcon`, `color`, `size`.
- `textInput` — antd `Input`, commits on blur / Enter (typing is held locally so the cell keeps focus). Config: `placeholder`, `allowClear`, `maxLength`, `showCount`, `inputType` (HTML input type — renamed to avoid clashing with `cell.type`), `variant`/`bordered`, `size`.
- `paragraphInput` — antd `Typography.Paragraph` with inline editing; commits on edit confirm. Config: `editable`, `maxLength`, `autoSize`, `editTooltip`, `copyable`, `ellipsis`, and text styling (`code`, `strong`, `italic`, `underline`, `delete`, `mark`, `textType`).
