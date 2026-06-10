---
'@lowdefy/blocks-antd': minor
---

feat(blocks-antd): Rename `TreeSelector` → `TreeInput`, add `TreeSelector` and
`TreeMultipleSelector` dropdown blocks, and give all three the data-driven selector model.

The inline tree block (antd `Tree`) is renamed **`TreeSelector` → `TreeInput`**. **Migration:**
update `type: TreeSelector` → `type: TreeInput` in your YAML. `TreeInput` is now driven by the same
flat model as the other selectors — `data` + `html` + `valueKey` + `primaryKey` + `parentKey` (or
`options`) — and stores a **single** `valueKey` value (previously a root-to-node path array), matched
back to a node by value. It also gains a `setData` method. (Nested `children` options are no longer
used; build the hierarchy from a flat array via `primaryKey`/`parentKey`.)

New **`TreeSelector`** (single, `valueType: any`) and **`TreeMultipleSelector`** (multiple,
`valueType: array`) wrap antd `TreeSelect` as searchable dropdowns, sharing the same model. Build a
flat `data`/`options` array where each row's `parentKey` references the parent row's `primaryKey`;
the tree is assembled with `treeDataSimpleMode`. Selecting stores the `valueKey` value; a
`SetState`-controlled value highlights the matching node(s). `showSearch`, `treeDefaultExpandAll`;
the multiple variant adds `checkable`, `showCheckedStrategy`, `maxTagCount`. Both register a
`setData` method (call it from the block's `onMount`) for large trees.

All three blocks support antd design-token `theme` overrides, and the dropdowns localise their
`placeholder` / not-found text via the `blocks.treeSelector.*` / `blocks.treeMultipleSelector.*`
i18n message keys.
