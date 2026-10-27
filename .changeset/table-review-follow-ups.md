---
'@lowdefy/blocks-table': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

fix(blocks-table): The details panel, TableInput and openFilter fixes from the Table review

- An app with a Table builds again. The date column filter imported `getOperatorLabel` from a file that had moved to `@lowdefy/helpers`, so the client bundle failed with "Could not resolve './getOperatorLabel.js'".
- A raw result the details panel loads from `rawEndpoint` no longer offers to add its values as extract columns. Extract columns read the raw result from the row, which such rows leave out, so a column added that way stayed empty. The panel now says the result was loaded and shows it read-only. Switching the open panel to another cell no longer shows the previous cell's raw result for a frame.
- TableInput names `rawEndpoint` as a Table-only property, as TableLight does, so a TableInput config that sets it fails the build with that message instead of accepting a property it never uses.
- A condition `openFilter({ key })` asked to focus is dropped if it has not appeared after about a second, or when the builder closes. Before, the next plain click on Filter could focus that old condition. `openFilter` also preloads the builder, as hovering the Filter button does.
