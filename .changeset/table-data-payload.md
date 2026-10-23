---
'@lowdefy/blocks-table': minor
---

feat(blocks-table): Table server mode adds the page's own fields to each fetch event with `data.payload`

A server-mode Table sent only its own fetch event, `{ startRow, endRow, view, groupPath, selected }`, so a filter the page keeps outside the table's view (a region picked above the table) had to be written into the view's filter, where it ended up in every saved view. `data.payload` is an object of fields the table adds to every fetch event, beside its own fields, which win on a clash. A changed payload starts the rows again from the top.
