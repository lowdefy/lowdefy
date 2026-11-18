---
'@lowdefy/blocks-table': minor
'@lowdefy/docs-content': patch
---

feat(blocks-table): Table column options take a `description`, shown under the label in an editable cell's dropdown

A `Table` or `TableInput` column's `options` entries now accept `description`, a line of plain text. The dropdown of an editable `tag`, `status` or `tags` cell shows it in the secondary text colour under the option's label, so a stage or status column can say what each value means where it is picked. When any option has a description the dropdown takes the width of its options instead of the cell's. The cell, the picked value in the editor, filters, quick filters, group headers and exports still show the label only, typing in the dropdown still searches labels, and options without a description look as before.
