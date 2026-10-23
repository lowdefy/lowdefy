---
'@lowdefy/blocks-table': minor
---

feat(blocks-table): A Table's `openFilter` method opens its filter builder

Only the toolbar's Filter button opened the filter builder, so an Edit filter button elsewhere on the page, such as in a list's header or its empty state, had no way to start editing the filter. `CallMethod` with `openFilter` now opens the builder, anchored to the toolbar's Filter button as a click on it does. With `{ key }` it first adds an empty condition on that column and focuses it. On a Table whose toolbar has no filter item, it logs a warning and does nothing.
