---
'@lowdefy/blocks-antd': minor
---

feat(blocks-antd): Add a data-driven way to populate selectors, with `valueKey` and `primaryKey`.

Every selector — `Selector`, `MultipleSelector`, `ButtonSelector`, `RadioSelector`,
`CheckboxSelector`, `SegmentedSelector` and `ListSelector` — can now be driven two ways:

- **`options`** (the original way): an array of primitives or `{ label, value }` pairs. Unchanged
  and fully backward compatible.
- **`data` + `html`**: pass raw rows and render each option label with a Nunjucks template, instead
  of building label/value pairs in your query.

New properties:

- `data` — raw rows, an alternative to `options`.
- `html` — Nunjucks template for each option label (context: `item`, `index`).
- `valueKey` — field stored as the value. With `options` it names the value field (defaults to
  `value`, so existing apps are unaffected); with `data` it names the field stored on select (omit to
  store the whole row).
- `primaryKey` — field used to match the current value (e.g. set with `SetState`) back to an option
  for highlighting. Defaults to `valueKey`.

Selecting an option stores `valueKey`'s value, and setting that value (or array of values for the
multi-value selectors) via `SetState` highlights the matching option(s). Object options no longer
require a `value` field (relaxed to support `valueKey`). Adds the shared `getSelectorOptions` and
`getSelectedIndex` helpers; `getUniqueValues`/`getValueIndex` remain for `PhoneNumberInput`.

Every selector also gains a **`setData`** method (call it with `CallMethod` from the block's
`onMount` event, after a request loads the rows) to supply `data` imperatively. The dataset is held
in the block instead of `properties`, so the engine no longer re-parses and re-serializes every row
on each update cycle — keeping pages with very large selectors responsive. The selector still falls
back to `properties.data`/`properties.options` until `setData` is called.
